from fastapi import FastAPI, Request, Body
from fastapi.responses import StreamingResponse
import uvicorn
from workflow_agent import run_agent_workflow
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from pydantic_core import to_jsonable_python
from pydantic_ai.messages import ModelMessagesTypeAdapter  
import os
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore_async
from pydantic import BaseModel, Field
import asyncio

load_dotenv()
secret = os.getenv('SECRET_KEY')

app = FastAPI()

origins = ["http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials = True,
    allow_methods=['*'],
    allow_headers=['*'], 
)

app.add_middleware(SessionMiddleware, secret_key=secret)

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore_async.client()

message_database = db.collection('message_history')
services_database = db.collection('services')

class AgentResponse(BaseModel):
    output: str
    title: str = Field(description="Make the chat title concise, preferably less than 3 characters")

def generate_title(user_prompt: str) -> str:
    """Generate a concise title from the user's first message"""
    title = user_prompt.strip()
    if len(title) > 50:
        title = title[:50].strip() + "..."
    
    title = ' '.join(title.split())
    
    if not title:
        title = "New Chat"
    
    return title


@app.post('/agent')
async def stream_agent(request: Request, input: dict = Body(...)):
    async def generate():
        try:
            chat_ref = message_database.document(input['chat_id'])
            chat_doc = await chat_ref.get()
            is_new_chat = not chat_doc.exists
            
            if chat_doc.exists:
                messages = chat_doc.to_dict()['messages']
                if messages:
                    message_history = ModelMessagesTypeAdapter.validate_python(json.loads(messages))
            else:
                message_history = []
            
            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing request...'})}\n\n"
            await asyncio.sleep(0.1)  # small delay for smooth UX
            
            result = await run_agent_workflow(input['prompt'], input['user_id'], history=message_history)
            res_history = to_jsonable_python(result.all_messages())
            
            title = generate_title(input['prompt']) if is_new_chat else None
            
            if chat_doc.exists:
                await chat_ref.update({'messages': json.dumps(res_history, ensure_ascii=False, indent=2)})
            else:
                await chat_ref.set({'title': title, 'user_id': input['user_id'], 'messages': json.dumps(res_history, ensure_ascii=False, indent=2)})
            
            output = "No response generated"
            messages = result.all_messages()
            
            for message in reversed(messages):
                if hasattr(message, 'kind') and message.kind == 'response':
                    if hasattr(message, 'parts'):
                        text_parts = []
                        for part in message.parts:
                            if hasattr(part, 'part_kind') and part.part_kind == 'text':
                                text_parts.append(part.content)
                        
                        if text_parts:
                            output = ''.join(text_parts)
                            break
            
            
            if output == "No response generated" and hasattr(result, 'data') and result.data:
                output = str(result.data)
            
            if title:
                yield f"data: {json.dumps({'type': 'title', 'content': title})}\n\n"
                await asyncio.sleep(0.05)
            
            words = output.split(' ')
            current_text = ""
            
            for i, word in enumerate(words):
                current_text += (word + " " if i < len(words) - 1 else word)
                
                yield f"data: {json.dumps({'type': 'content', 'content': current_text, 'partial': True})}\n\n"
                await asyncio.sleep(0.03) 
            
            yield f"data: {json.dumps({'type': 'content', 'content': current_text, 'partial': False})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

if __name__ == '__main__':
    uvicorn.run(app, host='', port=8000)
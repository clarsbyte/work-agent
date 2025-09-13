import base64
import os.path
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import firebase_admin
from firebase_admin import credentials, firestore_async
from token_encryption import token_encryptor

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

async def get_gmail_service(user_id):
    """Get authenticated Gmail service using OAuth 2.0"""
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        
        db = firestore_async.client()
        services_database = db.collection('services')
        
        user_doc = await services_database.document(user_id).get()
        if user_doc.exists:
            encrypted_token = user_doc.to_dict().get('token_gmail')
            if encrypted_token:
                try:
                    token_data = token_encryptor.decrypt_token(encrypted_token)
                    creds = Credentials.from_authorized_user_info(json.loads(token_data), SCOPES)
                    if creds and creds.valid:
                        return build("gmail", "v1", credentials=creds)
                    elif creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                        encrypted_updated_token = token_encryptor.encrypt_token(creds.to_json())
                        await services_database.document(user_id).update({
                            'token_gmail': encrypted_updated_token
                        })
                        return build("gmail", "v1", credentials=creds)
                except Exception as e:
                    print(e)
                    
        
        if os.path.exists("credentials.json"):
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=8002)
            
            encrypted_token = token_encryptor.encrypt_token(creds.to_json())
            if user_doc.exists:
                await services_database.document(user_id).update({
                    'token_gmail': encrypted_token
                })
            else:
                await services_database.document(user_id).set({
                    'user_id': user_id,
                    'token_gmail': encrypted_token
                })
            
            return build("gmail", "v1", credentials=creds)
        else:
            raise Exception(f"No credentials.json file found and no valid Gmail token for user {user_id}")
    except Exception as e:
        print(f"Error getting Gmail service: {e}")
        raise

async def gmail_send_message(to, origin, subject, content, user_id):
    """Create and send an email message
    Print the returned message id
    Returns: Message object, including message id
    """
    try:
        service = await get_gmail_service(user_id)
        
        message = MIMEMultipart('alternative')
        message["To"] = to
        message["From"] = origin
        message["Subject"] = subject
        
        html_part = MIMEText(content, 'html')
        message.attach(html_part)

        # encoded message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        create_message = {"raw": encoded_message}
        
        send_message = (
            service.users()
            .messages()
            .send(userId="me", body=create_message)
            .execute()
        )
        print(f'Message Id: {send_message["id"]}')
        
    except HttpError as error:
        print(f"An error occurred: {error}")
        send_message = None
        
    return send_message

if __name__ == "__main__":
    import asyncio
    asyncio.run(gmail_send_message("test@example.com", "sender@example.com", "Test", "Test content", "test_user_id"))
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from typing import Union, Literal, Optional
import os
from dotenv import load_dotenv
from email_tool import gmail_send_message
import asyncio
from calendar_tool import create_calendar_event
import datetime 

load_dotenv()
x = os.getenv('GOOGLE_API_KEY')

class EmailResponse(BaseModel):
    email_to: str
    email_origin: str
    subject: str
    content: str

class CalendarResponse(BaseModel):
    action_type: Literal["calendar"] = "calendar"
    title: str
    description: str
    start_date: str = Field(description="ISO 8601 format with timezone: YYYY-MM-DDTHH:MM:SS+07:00")
    end_date: str = Field(description="ISO 8601 format with timezone: YYYY-MM-DDTHH:MM:SS+07:00")
    timezone: str = Field(default="Asia/Jakarta", description="IANA timezone name like 'Asia/Jakarta' (default), 'America/New_York', 'Europe/London'")
    location: Optional[str] = Field(default=None, description="Meeting location or address")
    attendees: list[str] = Field(default=[], description="List of email addresses for attendees")
    recurrence: Optional[str] = Field(default=None, description="RRULE format like 'RRULE:FREQ=DAILY;COUNT=2' or 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR'")

class CombinedResponse(BaseModel):
    action: Literal['combined']
    email: Optional[EmailResponse] = None
    calendar: Optional[CalendarResponse] = None


ResponseModel = Union[CombinedResponse,EmailResponse, CalendarResponse]

prompt = """
You are an AI agent that helps people simplify their workflow. 
    You can generate emails, send them, and also schedule things on Google Calendar. You can also act like a normal chatbot if the user just wants to chat. So when they ask math questions or general questions, just answer them directly.
    
    Important: You have three main tools available:
    1. send_message - for sending emails
    2. create_event - for creating calendar events
    3. get_current_date - for getting the current date and time

    
    Based on the user's request, you should:
    - For EMAIL requests: Use send_message tool and return EmailResponse
    - For CALENDAR requests: Use create_event tool and return CalendarResponse  
    - For COMBINED requests: Use both tools and return CombinedResponse
    
    Email Guidelines:
    - Generate both subject and content
    - Make sure content is in HTML form for proper formatting
    - Use tags like <h2>, <p>, <strong>, <em>, <ul>, <li>, <br>
    - Always use the send_message tool when handling email requests
    
    Calendar Guidelines:
    - Dates: Use ISO 8601 format with Indonesia timezone: YYYY-MM-DDTHH:MM:SS+07:00
      Examples: '2025-05-28T09:00:00+07:00', '2026-12-25T14:30:00+07:00'
      *If user says "tomorrow/next week" → calculate actual date through running get_current_date tool first then calculate date from there
      *If user doesn't say year or month, like "31 August" or "This Sunday", always use get_current_date tool to know the date today in order to do date calculations
    - Timezone: Default to Indonesia time, but support other IANA timezone names:
      * 'Asia/Jakarta' (Indonesia Western Time - WIB) - DEFAULT
      * 'Asia/Makassar' (Indonesia Central Time - WITA)  
      * 'Asia/Jayapura' (Indonesia Eastern Time - WIT)
      * 'America/New_York' (Eastern Time)
      * 'Europe/London', 'Asia/Tokyo', etc.
    - Duration: Calculate end_date from start_date + duration
    - Attendees: Provide as list of email addresses ['email1@domain.com', 'email2@domain.com']
    - Recurrence: Use RRULE format if meeting repeats:
      * Daily: 'RRULE:FREQ=DAILY;COUNT=5' (5 times)
      * Weekly: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR' (Mon, Wed, Fri)
      * Monthly: 'RRULE:FREQ=MONTHLY;COUNT=3' (3 months)
    - Location: Include physical address or room details if mentioned
    - Always use the create_event tool when handling calendar requests
    
    Timezone Mapping for common terms:
    - "Indonesia Time" / "WIB" / "Jakarta Time" → "Asia/Jakarta" (DEFAULT)
    - "WITA" / "Makassar Time" → "Asia/Makassar"
    - "WIT" / "Jayapura Time" → "Asia/Jayapura" 
    - "Eastern Time" / "ET" → "America/New_York"
    - "Pacific Time" / "PT" → "America/Los_Angeles"
    - If no timezone specified → default to Asia/Jakarta (+07:00)
    
    REMEMBER:
    - Always use the appropriate tool(s) based on the user's request. 
    - Make sure to ask user's approval before sending or creating calendar event by providing them
    a draft of the email or/and event. 
    - Ask for user approval before using tools.
    - DO NOT mention the tools or paramaters in your response. Example of what NOT to do: "What is your email? (email_origin)"
"""

agent = Agent(
    'gemini-2.5-flash',
    system_prompt=prompt
)

@agent.tool
async def send_message(ctx: RunContext, email_to: str, email_origin: str, subject: str, content:str) -> str:
    user_id = ctx.deps.user_id
    
    res = await gmail_send_message(
        email_to,
        email_origin,
        subject, 
        content,
        user_id
    )
    return res

@agent.tool
async def create_event(ctx:RunContext, title:str, description: str, start_date: str, end_date: str, timezone: str = "Asia/Jakarta", attendees: list[str] = None, location: str = None, recurrence: str = None) -> str:
    if attendees is None:
        attendees = []
    
    user_id = ctx.deps.user_id
    
    res = await create_calendar_event(
        title,
        location,
        description,
        start_date,
        end_date, 
        timezone,
        attendees,
        recurrence,
        user_id
    )
    return res

@agent.tool
async def get_current_date(ctx:RunContext) -> str:
    now = datetime.datetime.now()
    return f"Current date: {now.strftime('%Y-%m-%d')}. Current time: {now.strftime('%H:%M:%S')}"

async def run_agent_workflow(user_prompt, user_id, history=[]):  
    class UserContext:
        def __init__(self, user_id):
            self.user_id = user_id
    
    result = await agent.run(user_prompt, message_history=history, deps=UserContext(user_id))
    return result

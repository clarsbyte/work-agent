import os
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import firebase_admin
from firebase_admin import credentials, firestore_async
from token_encryption import token_encryptor

SCOPES = ["https://www.googleapis.com/auth/calendar"]


async def get_calendar_service(user_id):
    """Get authenticated Calendar service using OAuth 2.0"""
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        
        db = firestore_async.client()
        services_database = db.collection('services')
        
        user_doc = await services_database.document(user_id).get()
        if user_doc.exists:
            encrypted_token = user_doc.to_dict().get('token_calendar')
            if encrypted_token:
                try:
                    token_data = token_encryptor.decrypt_token(encrypted_token)
                    creds = Credentials.from_authorized_user_info(json.loads(token_data), SCOPES)
                    if creds and creds.valid:
                        return build("calendar", "v3", credentials=creds)
                    elif creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                        encrypted_updated_token = token_encryptor.encrypt_token(creds.to_json())
                        await services_database.document(user_id).update({
                            'token_calendar': encrypted_updated_token
                        })
                        return build("calendar", "v3", credentials=creds)
                except Exception as e:
                    print(f"Error decrypting Calendar token: {e}")
        
        if os.path.exists("credentials.json"):
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=8001)
            
            encrypted_token = token_encryptor.encrypt_token(creds.to_json())
            if user_doc.exists:
                await services_database.document(user_id).update({
                    'token_calendar': encrypted_token
                })
            else:
                await services_database.document(user_id).set({
                    'token_calendar': encrypted_token
                })
            
            return build("calendar", "v3", credentials=creds)
        else:
            raise Exception(f"No credentials.json file found and no valid Calendar token for user {user_id}")
    except Exception as e:
        print(f"Error getting Calendar service: {e}")
        raise

async def create_calendar_event(title, location, description, start_date, end_date, timezone, attendees, recurrence, user_id):
    """Creates a Google Calendar
    """
    try:
        service = await get_calendar_service(user_id)
        
        event = {
          'summary': title,
          'location': location,
          'description': description,
          'start': {
            'dateTime': start_date,
            'timeZone': timezone,
          },
          'end': {
            'dateTime': end_date,
            'timeZone': timezone
          },
          'recurrence': [
            recurrence
          ],
          'attendees': [
            {'email': x} for x in attendees
          ],
          'reminders': {
            'useDefault': False,
            'overrides': [
              {'method': 'email', 'minutes': 24 * 60},
              {'method': 'popup', 'minutes': 10},
            ],
          },
        }

        event = service.events().insert(calendarId='primary', body=event).execute()
        print( 'Event created: %s' % (event.get('htmlLink')))
    except HttpError as err:
        raise err

    return event

if __name__ == '__main__':
    import asyncio
    asyncio.run(create_calendar_event("Test Event", "Location", "Description", "2025-09-01T10:00:00+07:00", "2025-09-01T11:00:00+07:00", "Asia/Jakarta", [], None, "test_user_id"))
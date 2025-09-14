# Worme - AI Work Agent

**An AI agent built to ease your work.**

Integrated with Gmail and Google Calendar, Worme can help you send emails and schedule meetings all in under a minute, helping you focus on important work that you have.
Walkthrough video:
<video src='https://github.com/user-attachments/assets/b2f3050e-2525-413f-bab8-25f6c368a1e1' />

<img width="1910" height="910" alt="image" src="https://github.com/user-attachments/assets/78d6b583-5675-4763-b67a-34d7727f9866" />
<img width="1916" height="887" alt="image" src="https://github.com/user-attachments/assets/35d657f9-3070-4674-8eb8-adb49994f70e" />

## Features

- **AI-Powered Workflow Optimization** - Intelligent automation to streamline your daily tasks
- **Gmail Integration** - Send and manage emails effortlessly
- **Google Calendar Integration** - Schedule meetings and manage your calendar
- **Fast Operations** - Complete tasks in under a minute
- **Focus Enhancement** - Automate routine tasks so you can focus on what matters

## Tech Stack

- **Backend**: Python
- **Frontend**: Node.js/React
- **Integrations**: Gmail API, Google Calendar API, Gemini, PyDantic, Firebase

## Prerequisites

Before running the application, make sure you have:

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager
- Google Cloud Console project with Gmail and Calendar APIs enabled
- Required API credentials and authentication setup
- Firebase setup

## Firebase Setup
### Step 1: Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "worme-work-agent")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore Database

1. In your Firebase project dashboard, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location closest to your users (e.g., `asia-southeast1` for Indonesia)
5. Click "Done"

### Step 3: Database Structure

Create the following collections in your Firestore database:

#### Collection: `message_history`

This stores all conversation history between users and the AI agent.

**Document ID Format**: Timestamp-based (e.g., `1757758874549`)

**Document Structure**:
```json
{
  "messages": "[{\"parts\":[{\"content\":\"System prompt content\",\"timestamp\":\"2025-09-13T08:07:55.163768Z\",\"part_kind\":\"system-prompt\"},{\"content\":\"User message\",\"timestamp\":\"2025-09-13T08:07:55.163775Z\",\"part_kind\":\"user-prompt\"}],\"usage\":{\"input_tokens\":1185,\"output_tokens\":814,\"model_name\":\"gemini-2.5-flash\"}}]",
  "title": "Brief description of the conversation",
  "user_id": "Firebase_Auth_User_ID"
}
```

**Fields Explanation**:
- `messages`: JSON string containing the full conversation with AI model usage data
- `title`: Human-readable title for the conversation
- `user_id`: Firebase Authentication user ID to associate conversations with users

#### Collection: `services`

This stores encrypted user authentication tokens for Google services.

**Document ID Format**: Firebase Auth User ID (e.g., `S8tFnUc0hRM9KPJC9gIHf806hOV2`)

**Document Structure**:
```json
{
  "token_calendar": "Z0FBQUFBQm94YTl...",
  "token_gmail": "Z0FBQUFBQm94YU9...",
  "username": "clarissa"
}
```

**Fields Explanation**:
- `token_calendar`: Encrypted Google Calendar API access token
- `token_gmail`: Encrypted Gmail API access token
- `username`: User's display name

### Step 4: Configure Security Rules

Replace the default Firestore security rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access their own message history
    match /message_history/{messageId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Allow authenticated users to access their own service tokens
    match /services/{userId} {
      allow read, write: if request.auth != null && 
        userId == request.auth.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**To apply these rules**:
1. In Firebase Console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the existing rules with the code above
4. Click "Publish"

### Step 5: Get Firebase Configuration

1. In Firebase Console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. If you haven't added a web app, click "Add app" and select web
4. Register your app with a name
5. Copy the Firebase configuration object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Step 6: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Choose Email/Password

Your Firebase database is now ready to support the Worme.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/clarsbyte/work-agent.git
cd work-agent
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables (create .env file)
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (if separate)
cd frontend  # adjust path as needed

# Install Node.js dependencies
npm install
```

### 4. Google API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API and Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON file
6. Place the credentials in your project directory and update your `.env` file

## Running the Application

### Start the Backend

```bash
python workflow_api.py
```

The backend API will start running on `http://localhost:8000` (or your configured port).

### Start the Frontend

In a new terminal window:

```bash
npm run dev
```

The frontend will start running on `http://localhost:3000` (or your configured port).

## Usage

1. **Access the Application**: Open your browser and navigate to the frontend URL
2. **Authentication**: Complete the Google OAuth flow to connect your Gmail and Calendar
3. **Optimize Your Workflow**: Use the AI agent to:
   - Send emails quickly
   - Schedule meetings automatically
   - Manage your calendar efficiently
   - Automate routine tasks

## API Endpoints

The backend provides RESTful API endpoints for:

- `/agent` - Run agent

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
GOOGLE_API_KEY = YOUR_GEMINI_KEY
SECRET_KEY = FOR_ENCRYPTION
NEXT_PUBLIC_FIREBASE_API_KEY = YOUR_FIREBASE_KEY
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Backend not starting:**
- Ensure you're in the `backend/` directory when running `python workflow_api.py`
- Check if all Python dependencies are installed: `pip install -r requirements.txt`
- Verify your `.env` file is in the `backend/` directory
- Make sure `credentials.json` is present in the `backend/` directory
- Make sure `serviceAccountKey.json` is present in the `backend/` directory

**Frontend not starting:**
- Ensure you're in the `frontend/` directory when running `npm run dev`
- Run `npm install` to ensure all dependencies are installed
- Check for port conflicts (usually runs on port 3000)
- Verify Node.js and npm versions are compatible with Next.js

**Google API Authentication Issues:**
- Verify `credentials.json` is properly configured
- Check that Gmail API and Google Calendar API are enabled in Google Cloud Console
- Ensure your OAuth consent screen is properly set up
- Verify the redirect URIs match your configuration

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/clarsbyte/work-agent/issues) section
2. Create a new issue with detailed information about your problem
3. Include error messages and steps to reproduce

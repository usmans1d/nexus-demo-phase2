# Nexus Platform - Phase 2 (Week 1 & 2)

This directory contains the completed Phase 2 tasks for the Nexus Investor & Entrepreneur Collaboration Platform, stopping at Week 2 as requested.

## Features Implemented

### Week 1: Setup & Core Backend Foundations
- Fully functional **Node.js + Express + MongoDB** backend.
- Complete **JWT-based Authentication** with bcrypt password hashing.
- **Role-based Access**: Differentiates between `investor` and `entrepreneur`.
- Connected the frontend React application to the backend API (`/api/auth`).
- Profile management and database storage for users.

### Week 2: Collaboration & Document Handling
- **Meeting Scheduling System**: Users can request meetings and accept/reject them. Includes backend double-booking conflict detection.
- **Video Calling Integration**: Real-time WebRTC signaling server built with `Socket.IO`. Frontend features local/remote video streams and toggle audio/video buttons.
- **Document Processing Chamber**: File upload API using `multer`. Frontend integration with `react-pdf` to preview documents securely.

---

## How to Run the Project Locally

You will need two terminal windows open to run the full stack application.

### 1. Start the Backend Server

Open a terminal in the `Phase 2/backend` directory:
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000` and connect to your local MongoDB instance.

### 2. Start the Frontend React App

Open a *second* terminal in the `Phase 2/frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start (usually on `http://localhost:5173`). Open that URL in your browser!

### Testing the App
1. Create a new account as an **Entrepreneur** or **Investor**.
2. Visit the Dashboard to see your scheduled meetings.
3. Visit a user's profile to schedule a collaboration meeting.
4. Go to the Documents tab to upload and preview PDFs.
5. Go to the Chat tab to start a Video Call.

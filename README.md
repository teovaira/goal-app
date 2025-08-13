# Goal Tracker

A goal tracking app with completion status and filtering

## Description

Goal Tracker is a full-stack web application that helps users create, track, and manage their personal goals. Built with React and Node.js, it features user authentication, goal management, and completion status tracking and filtering.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB (local installation or MongoDB Atlas account)

## Installation

Clone the repository and install dependencies for both frontend and backend:

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Environment Setup

### Backend Configuration

1. Navigate to the backend directory and create a `.env` file:
   ```
   cd backend
   cp .env.example .env
   ```

2. Open the `.env` file and update the following variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secret key for JWT tokens (use a strong, random string)
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID (optional, for Google login)
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret (optional)

### Frontend Configuration

1. Navigate to the frontend directory and create a `.env` file:
   ```
   cd frontend
   cp .env.example .env
   ```

2. Update the environment variables as needed (typically the backend API URL).

## Running the Application

### Development Mode

You'll need to run both the backend and frontend servers:

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```
   The backend will run on http://localhost:5000

2. In a new terminal, start the frontend server:
   ```
   cd frontend
   npm run dev
   ```
   The frontend will run on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

## Running Tests

### Backend Tests

Navigate to the backend directory and run:
```
cd backend
npm test
```

To run tests in watch mode:
```
npm run test:watch
```

## Basic Usage

1. **Register**: Create a new account using the registration form
2. **Login**: Sign in with your credentials or use Google OAuth
3. **Create Goals**: Add new goals with titles and descriptions
4. **Completion Status Tracking**: Monitor and update your goals' statuses
5. **Manage Goals**: Edit or delete goals as needed

## Project Structure

```
goal-app/
├── backend/          # Node.js Express server
│   ├── controllers/  # Route controllers
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   └── tests/        # Backend tests
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── services/    # API services
│   └── public/          # Static files
└── README.md
```

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT, Google OAuth
- **Testing**: Jest

## License

This project is licensed under the MIT License - see the LICENSE file for details.

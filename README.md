# ED Dashboard

A comprehensive ED management system built with React, Node.js, and PostgreSQL.

## Project Structure

```
DashBoard/
├── frontend/         # React frontend application
├── backend/         # Node.js backend server
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your database configuration:
   ```
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dashboard
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Features

- Staff Management
- Contractor Management
- Vehicle Management
- AMC Contract Management
- Finance Management
- Department Management
- User Authentication and Authorization

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Material-UI
  - React Router
  - Axios

- Backend:
  - Node.js
  - Express
  - PostgreSQL
  - TypeScript
  - JWT Authentication

## Development Team

- [kalasagar Battepati]
- [Aniket] 

# Authentication System

A simple authentication system built with React.js, Express.js, and MongoDB.

## Tech Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

## Features

- User registration with role selection (Student/Professor)
- User login with email OTP verification
- JWT token-based authentication
- Protected routes
- Simple dashboard showing user information
- Logout functionality

## Project Structure

```
project/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # Login and Register components
│   │   │   └── ui/          # LoadingSpinner component
│   │   ├── contexts/        # AuthContext
│   │   ├── hooks/           # useAuth hook
│   │   ├── services/        # API services
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Express.js backend
│   ├── config/              # Database configuration
│   ├── models/              # User model
│   ├── routes/              # Auth routes
│   ├── middleware/          # Auth middleware
│   ├── package.json
│   └── index.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Backend (create `backend/.env`):
   ```env
   PORT=3002
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/auth-system
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FRONTEND_URL=http://localhost:5173
   ```

   Frontend (create `frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:3002/api
   ```

5. **Start MongoDB**
   ```bash
   sudo systemctl start mongod
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3002

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (sends OTP)
- `POST /api/auth/verify-otp` - Verify OTP and complete login

## Usage

1. **Register**: Create a new account with email, password, and role
2. **Login**: Sign in with your credentials and verify OTP sent to email
3. **Dashboard**: View your user information and logout

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation with express-validator
- CORS configuration
- Rate limiting
- Helmet.js security headers
- Email OTP verification

## License

This project is licensed under the MIT License.

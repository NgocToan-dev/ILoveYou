# ILoveYou Backend API

Express.js backend server for the ILoveYou couple tracking application. This backend provides RESTful APIs for managing couples, notes, reminders, and love day milestones.

## 🚀 Features

- **Authentication**: Firebase Authentication integration
- **Notes Management**: Create, read, update, delete notes with media support
- **Reminders**: Schedule and manage reminders with snooze functionality
- **Couples Management**: Create couples, invite partners, manage relationships
- **Love Days**: Track relationship milestones and anniversaries
- **Security**: Rate limiting, CORS, helmet security headers
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Request validation using express-validator

## 📋 Prerequisites

- Node.js >= 18.0.0
- Firebase project with Firestore enabled
- Firebase Admin SDK service account key (for production)

## 🛠️ Installation

1. **Clone the repository and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   FRONTEND_URL=http://localhost:5173
   ```

4. **Firebase Configuration**:
   
   **For Development:**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Set default project: `firebase use your-project-id`
   - The server will use default credentials

   **For Production:**
   - Create a service account in Firebase Console
   - Download the service account key JSON
   - Set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the JSON content

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```
Server will start on `http://localhost:3001` with auto-reload.

### Production Mode
```bash
npm start
```

### Other Scripts
```bash
# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### API Endpoints

#### 🔐 Authentication (`/api/auth`)
- `GET /me` - Get current user profile
- `POST /profile` - Update user profile
- `POST /verify-token` - Verify Firebase ID token
- `POST /refresh-token` - Refresh authentication token
- `DELETE /account` - Delete user account

#### 📝 Notes (`/api/notes`)
- `GET /` - Get user notes (with pagination and filtering)
- `GET /:id` - Get specific note
- `POST /` - Create new note
- `PUT /:id` - Update note
- `DELETE /:id` - Delete note

#### ⏰ Reminders (`/api/reminders`)
- `GET /` - Get user reminders (with pagination and filtering)
- `GET /:id` - Get specific reminder
- `POST /` - Create new reminder
- `PUT /:id` - Update reminder
- `POST /:id/snooze` - Snooze reminder
- `DELETE /:id` - Delete reminder

#### 💕 Couples (`/api/couples`)
- `GET /me` - Get current user's couple information
- `POST /` - Create new couple or join with invite code
- `PUT /:id` - Update couple information
- `POST /:id/leave` - Leave or dissolve couple
- `GET /:id/invite-code` - Generate invite code for partner

#### 💖 Love Days (`/api/love-days`)
- `GET /` - Get love days and milestones for couple
- `GET /current` - Get current love day count
- `GET /milestones/upcoming` - Get upcoming milestones
- `POST /celebrate` - Mark milestone as celebrated

#### 🏥 Health Check
- `GET /health` - Server health status

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "errors": [...] // Optional validation errors
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Paginated Response
```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK configuration
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   ├── requestLogger.js     # Request logging
│   │   └── responseFormatter.js # Response formatting
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── couples.js           # Couples management routes
│   │   ├── love-days.js         # Love days/milestones routes
│   │   ├── notes.js             # Notes management routes
│   │   └── reminders.js         # Reminders management routes
│   └── index.js                 # Main application entry point
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers protection
- **Input Validation**: Request validation using express-validator
- **Authentication**: Firebase ID token verification
- **Error Handling**: Secure error messages without sensitive data exposure

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database URL | - |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | - |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON (production) | - |
| `FRONTEND_URL` | Frontend application URL | http://localhost:5173 |
| `WEB_APP_URL` | Web application URL | http://localhost:3000 |

### Firebase Collections

The backend expects these Firestore collections:
- `users` - User profiles and preferences
- `couples` - Couple relationships and metadata
- `notes` - User notes with optional media attachments
- `reminders` - Scheduled reminders and notifications
- `celebrations` - Milestone celebration records

## 🚀 Deployment

### Using PM2 (Recommended for production)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start src/index.js --name "iloveyou-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build Docker image
docker build -t iloveyou-backend .

# Run container
docker run -p 3001:3001 --env-file .env iloveyou-backend
```

### Environment Setup for Production
1. Set `NODE_ENV=production`
2. Configure Firebase service account key
3. Set appropriate CORS origins
4. Configure SSL/TLS termination (using reverse proxy like nginx)
5. Set up monitoring and logging

## 🤝 Integration with Shared Services

This backend is designed to work with the shared services located in the `../shared/` directory:

- **Firebase Services**: Authentication, Firestore, Storage
- **Models**: Note and Reminder model classes
- **Utilities**: Date utilities and internationalization
- **Constants**: Application constants and configurations

## 📝 Contributing

1. Follow the existing code style and patterns
2. Add appropriate error handling and validation
3. Include JSDoc comments for new functions
4. Test your changes thoroughly
5. Update this README if you add new features

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**:
   - Ensure Firebase project is configured correctly
   - Check service account permissions
   - Verify environment variables

2. **CORS Errors**:
   - Update `FRONTEND_URL` in environment variables
   - Check frontend origin configuration

3. **Rate Limiting**:
   - Adjust rate limiting settings in `src/index.js`
   - Consider implementing user-based rate limiting

4. **Database Connection Issues**:
   - Verify Firestore security rules
   - Check network connectivity
   - Ensure proper Firebase configuration

## 📄 License

This project is licensed under the terms specified in the main project repository.
# Backend API Integration Guide

This document explains how the React frontend has been updated to integrate with the Express backend API.

## Overview

The frontend now uses a **hybrid approach** that can communicate with both Firebase and the Express backend API. This allows for:

- **Seamless migration** from Firebase to backend API
- **Fallback support** to Firebase if backend is unavailable
- **Development flexibility** to switch between services
- **Gradual adoption** of backend features

## Architecture

### New Service Layer

The integration introduces a new service layer with hybrid services:

```
web/src/services/
├── backendApi.js         # Backend API client
├── notesService.js       # Hybrid notes service
├── remindersService.js   # Hybrid reminders service
├── couplesService.js     # Hybrid couples service
├── loveDaysService.js    # Hybrid love days service
├── authService.js        # Hybrid auth service
└── index.js             # Service exports
```

### Backend API Client

**File:** `web/src/services/backendApi.js`

This is the core client that handles:
- Authentication headers with Firebase tokens
- HTTP requests to the Express backend
- Error handling and logging
- All CRUD operations for each entity

**Key Features:**
- Automatic Firebase token inclusion
- Consistent error handling
- RESTful API integration
- Health check capabilities

### Hybrid Services

Each entity (notes, reminders, couples, love-days) has a hybrid service that:
- Checks backend availability
- Routes requests to backend or Firebase
- Provides fallback functionality
- Maintains backward compatibility

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# Backend API Configuration
VITE_BACKEND_API_URL=http://localhost:3001/api
VITE_USE_BACKEND_API=false
VITE_FALLBACK_TO_FIREBASE=true
```

### Configuration Options

- **`VITE_BACKEND_API_URL`**: Backend API base URL
- **`VITE_USE_BACKEND_API`**: Enable/disable backend API usage
- **`VITE_FALLBACK_TO_FIREBASE`**: Enable fallback to Firebase when backend fails

## Usage Examples

### Basic Usage

```javascript
import { notesService, remindersService } from '../services';

// Create a note (will use backend if available, fallback to Firebase)
const result = await notesService.createNote({
  title: 'My Note',
  content: 'Note content',
  category: 'general'
});

// Get reminders
const reminders = await remindersService.getUserPersonalReminders(userId);
```

### Service Switching

```javascript
// Force backend mode
notesService.forceBackendMode();

// Force Firebase mode
notesService.forceFirebaseMode();

// Check current mode
const mode = notesService.getCurrentMode();
console.log(mode); // { useBackend: true, fallbackEnabled: true }
```

### Error Handling

```javascript
try {
  const result = await notesService.createNote(noteData);
  console.log('Created via:', result.source); // 'backend' or 'firebase'
  console.log('Data:', result.data);
} catch (error) {
  console.error('Failed to create note:', error);
}
```

## API Endpoints

The backend API provides the following endpoints:

### Notes
- `GET /api/notes` - Get user's notes with pagination
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Reminders
- `GET /api/reminders` - Get user's reminders
- `GET /api/reminders/:id` - Get specific reminder
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder
- `PUT /api/reminders/:id/complete` - Mark as completed
- `PUT /api/reminders/:id/snooze` - Snooze reminder

### Couples
- `GET /api/couples/profile` - Get couple profile
- `PUT /api/couples/profile` - Update couple profile
- `POST /api/couples/invite` - Send invitation
- `PUT /api/couples/accept-invitation` - Accept invitation
- `GET /api/couples/data` - Get couple data

### Love Days
- `GET /api/love-days` - Get love days
- `POST /api/love-days` - Create love day
- `PUT /api/love-days/:id` - Update love day
- `DELETE /api/love-days/:id` - Delete love day

### Authentication
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/verify` - Verify token

## Component Updates

### Example: NotesPage Component

The NotesPage has been updated to use the hybrid service:

```javascript
// Before
import { subscribeToUserPrivateNotes, deleteNote } from '../../../shared/services/firebase/notes';

// After
import { notesService } from '../services';

// Usage
const unsubscribe = notesService.subscribeToUserPrivateNotes(userId, category, callback);
await notesService.deleteNote(noteId);
```

## Real-time Features

**Important:** Real-time subscriptions currently use Firebase only, as the backend doesn't support WebSocket connections yet.

```javascript
// These always use Firebase
notesService.subscribeToUserPrivateNotes(userId, category, callback);
remindersService.subscribeToUserPersonalReminders(userId, includeCompleted, callback);
```

## Development Workflow

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:3001`

### 2. Configure Frontend

Set environment variables to enable backend:

```env
VITE_USE_BACKEND_API=true
VITE_BACKEND_API_URL=http://localhost:3001/api
```

### 3. Test Integration

1. **Health Check**: The services automatically check backend availability
2. **Fallback Testing**: Disable backend to test Firebase fallback
3. **Service Switching**: Use force methods to test specific services

## Migration Strategy

### Phase 1: Development (Current)
- Backend API available but disabled by default
- All operations use Firebase
- Backend integration tested separately

### Phase 2: Gradual Adoption
- Enable backend for specific features
- Keep Firebase as fallback
- Monitor performance and reliability

### Phase 3: Full Migration
- Backend as primary service
- Firebase as backup only
- Real-time features migrated to WebSocket

## Error Handling

The hybrid services provide comprehensive error handling:

1. **Backend Unavailable**: Automatically falls back to Firebase
2. **Authentication Errors**: Refreshes tokens and retries
3. **Network Errors**: Provides meaningful error messages
4. **Service Errors**: Logs detailed error information

## Performance Considerations

- **Health Checks**: Minimal overhead for availability checking
- **Token Caching**: Firebase tokens are cached and refreshed as needed
- **Request Logging**: All backend requests are logged for debugging
- **Fallback Speed**: Firebase fallback is nearly instantaneous

## Testing

### Manual Testing

1. Start backend server
2. Set `VITE_USE_BACKEND_API=true`
3. Test CRUD operations
4. Stop backend server
5. Verify Firebase fallback works

### Automated Testing

```javascript
// Test service availability
const isAvailable = await notesService.checkBackendAvailability();

// Test fallback
notesService.forceFirebaseMode();
const result = await notesService.createNote(data);
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for frontend URL
2. **Authentication Failures**: Check Firebase token generation
3. **Network Timeouts**: Verify backend server is running
4. **Fallback Not Working**: Check `VITE_FALLBACK_TO_FIREBASE` setting

### Debug Mode

Enable detailed logging:

```javascript
// Check service status
console.log('Backend available:', await backendApi.healthCheck());
console.log('Service mode:', notesService.getCurrentMode());
```

## Future Enhancements

1. **WebSocket Support**: Real-time features via backend
2. **Caching Layer**: Local caching for better performance
3. **Offline Support**: Queue operations when offline
4. **Analytics**: Track service usage and performance
5. **Auto-scaling**: Automatic service selection based on load

## Security

- **Authentication**: All requests include Firebase ID tokens
- **Authorization**: Backend validates user permissions
- **HTTPS**: Use HTTPS in production
- **Token Refresh**: Automatic token refresh on expiry
# Zen kAI API Documentation

This document describes the REST API endpoints for the Zen kAI backend.

## Base URL

```
http://localhost:4000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here"
}
```

#### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

### Check-ins

#### POST /checkin
Create a new check-in entry.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "mood": 7,
  "energy": 6,
  "reflection": "Today was productive and I felt good about my progress.",
  "tags": ["productive", "positive"]
}
```

**Response:**
```json
{
  "id": "checkin_id",
  "userId": "user_id",
  "mood": 7,
  "energy": 6,
  "reflection": "Today was productive and I felt good about my progress.",
  "tags": ["productive", "positive"],
  "score": 85,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /checkin
Get user's check-in history.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 10)
- `offset` (optional): Number of entries to skip (default: 0)

**Response:**
```json
{
  "checkins": [
    {
      "id": "checkin_id",
      "mood": 7,
      "energy": 6,
      "reflection": "Today was productive...",
      "tags": ["productive", "positive"],
      "score": 85,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### GET /checkin/stats
Get user's check-in statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "totalCheckins": 30,
  "averageMood": 7.2,
  "averageEnergy": 6.8,
  "streakDays": 5,
  "totalScore": 2550,
  "weeklyProgress": [
    {
      "date": "2024-01-01",
      "score": 85
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: No token provided"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP address
- Authentication endpoints: 5 requests per 15 minutes per IP

## Data Models

### User
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "passwordHash": "hashed_password",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Check-in
```json
{
  "id": "checkin_id",
  "userId": "user_id",
  "mood": 7,
  "energy": 6,
  "reflection": "User's reflection text",
  "tags": ["tag1", "tag2"],
  "score": 85,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

The API requires the following environment variables:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)

## Testing

You can test the API using tools like:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [curl](https://curl.se/)

Example curl command:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
``` 
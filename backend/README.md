# Gymbro Backend

A lightweight Node.js backend for the Gymbro fitness tracking application.

## Features

- 🔐 JWT-based authentication
- 📱 RESTful API
- 🗄️ SQLite database (file-based, no server required)
- 🛡️ Basic security middleware
- 🚀 Minimal dependencies

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Initialize database:**
   ```bash
   npm run init-db
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Data Sync
- `GET /api/data/sync` - Get all user data
- `POST /api/data/sync` - Sync all user data
- `GET /api/data/:dataType` - Get specific data type
- `POST /api/data/:dataType` - Save specific data type
- `DELETE /api/data/:dataType` - Delete specific data type

## Environment Variables

Create a `.env` file with:

```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
DB_PATH=./database/gymbro.db
```

## Usage Examples

### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Sync data (with token):
```bash
curl -X POST http://localhost:3000/api/data/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"data":{"workoutHistory":[],"supplementTracking":{}}}'
```

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `name` - User's display name
- `created_at` - Account creation timestamp

### User Data Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `data_type` - Type of data (workoutHistory, supplementTracking, etc.)
- `data` - JSON data
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Production Deployment

1. Change `JWT_SECRET` to a strong, random value
2. Set `NODE_ENV=production`
3. Update CORS origins in `server.js`
4. Use `npm start` instead of `npm run dev`

## Dependencies

- **express** - Web framework
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **better-sqlite3** - SQLite database
- **cors** - Cross-origin requests
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variables

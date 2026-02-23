# Testing Guide for Syllaparse

This guide will help you verify that your Syllaparse project is working correctly.

## Prerequisites Check

Before testing, ensure you have:

1. **Backend dependencies installed:**

   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Frontend dependencies installed:**

   ```bash
   cd frontend
   npm install
   ```

3. **Environment variables configured:**
   - Backend `.env` file should include:
     - `DATABASE_URL` - PostgreSQL connection string
     - `OPENAI_API_KEY` - Your OpenAI API key
     - Google Cloud Storage credentials configured
   - Frontend `.env.local` or `.env` should include:
     - `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:8000`)

## Step 1: Test Backend Server

### 1.1 Start the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Expected output:**

- Server should start on `http://localhost:8000`
- You should see: `INFO:     Uvicorn running on http://127.0.0.1:8000`
- Database tables should be created (check logs for "Database tables created successfully")

### 1.2 Test Backend Health Endpoint

Open your browser or use curl:

```bash
curl http://localhost:8000/health
```

**Expected response:**

```json
{ "status": "healthy" }
```

### 1.3 Test Backend Root Endpoint

```bash
curl http://localhost:8000/
```

**Expected response:**

```json
{ "message": "Welcome to Syllaparse API" }
```

### 1.4 Check API Documentation

Open in browser: `http://localhost:8000/docs`

**Expected:**

- FastAPI interactive documentation (Swagger UI) should load
- You should see all available endpoints listed
- Endpoints should include: `/files`, `/auth`, `/users`, `/summaries`, `/assignments`, `/exams`, `/lectures`, `/processing`

### 1.5 Test Database Connection

The backend will attempt to create database tables on startup. Check the logs:

- ✅ Success: "Database tables created successfully"
- ⚠️ Warning: "Could not create database tables" - This means DATABASE_URL might not be set or database is not accessible

## Step 2: Test Frontend Server

### 2.1 Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

**Expected output:**

- Server should start on `http://localhost:3000`
- You should see: `- Local: http://localhost:3000`

### 2.2 Test Frontend Homepage

Open in browser: `http://localhost:3000`

**Expected:**

- Homepage should load without errors
- No console errors in browser DevTools
- UI should render properly

### 2.3 Test Frontend-Backend Connection

Open browser DevTools (F12) → Console tab, then:

```javascript
fetch("http://localhost:8000/health")
  .then((r) => r.json())
  .then(console.log);
```

**Expected response:**

```json
{ "status": "healthy" }
```

## Step 3: Integration Testing

### 3.1 Test Authentication Flow

1. Navigate to `http://localhost:3000`
2. Click on "Sign in with Google" button
3. Complete Google OAuth flow
4. **Expected:** You should be redirected back and logged in

### 3.2 Test File Upload

1. While logged in, try uploading a PDF syllabus file
2. **Expected:**
   - File should upload successfully
   - File should appear in your file history
   - No errors in console

### 3.3 Test Syllabus Parsing

1. After uploading a file, trigger parsing (if automatic) or click parse button
2. **Expected:**
   - Parsing should start
   - Status should update
   - After completion, you should see:
     - Summary
     - Assignments
     - Exams
     - Lecture schedule

### 3.4 Test Data Display

Navigate to `/stats` page (or wherever your stats are displayed)

**Expected:**

- Assignments should be listed
- Exams should be listed
- Lecture times should be displayed
- Summary statistics should be shown

## Step 4: API Endpoint Testing

You can test individual endpoints using the FastAPI docs at `http://localhost:8000/docs` or using curl:

### Test Files Endpoint

```bash
# Get files (requires authentication)
curl http://localhost:8000/files?google_id=YOUR_GOOGLE_ID
```

### Test Users Endpoint

```bash
# Get user by Google ID
curl http://localhost:8000/users/google/YOUR_GOOGLE_ID
```

### Test Processing Endpoint

```bash
# Parse a syllabus (requires file_id)
curl -X POST http://localhost:8000/processing/parse/FILE_ID
```

## Common Issues and Troubleshooting

### Backend Issues

**Problem: Database connection error**

- **Solution:** Check that `DATABASE_URL` is set correctly in backend `.env`
- Verify database is accessible and credentials are correct

**Problem: OpenAI API errors**

- **Solution:** Verify `OPENAI_API_KEY` is set in backend `.env`
- Check that your OpenAI account has credits

**Problem: Google Cloud Storage errors**

- **Solution:** Ensure service account JSON is in `credentials/service-account.json`
- Verify Google Cloud project has Storage API enabled

**Problem: Port 8000 already in use**

- **Solution:** Kill the process using port 8000 or change the port:
  ```bash
  uvicorn app.main:app --reload --port 8001
  ```

### Frontend Issues

**Problem: Cannot connect to backend**

- **Solution:**
  - Verify backend is running on port 8000
  - Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
  - Check CORS settings in backend

**Problem: Port 3000 already in use**

- **Solution:**
  ```bash
  npm run dev -- -p 3001
  ```

**Problem: Build errors**

- **Solution:**
  ```bash
  cd frontend
  rm -rf .next node_modules
  npm install
  npm run dev
  ```

### Integration Issues

**Problem: File upload fails**

- **Check:**
  - Backend is running
  - Google Cloud Storage credentials are correct
  - File size limits (if any)

**Problem: Parsing doesn't work**

- **Check:**
  - OpenAI API key is valid
  - File was uploaded successfully
  - Backend logs for error messages

## Quick Health Check Script

You can create a simple test script to verify everything is working:

```bash
#!/bin/bash

echo "Testing Backend..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/health)
if [[ $BACKEND_HEALTH == *"healthy"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

echo "Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ $FRONTEND_RESPONSE == "200" ]; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding (HTTP $FRONTEND_RESPONSE)"
fi
```

Save as `test-health.sh`, make it executable (`chmod +x test-health.sh`), and run it.

## Next Steps

Once all tests pass:

- ✅ Backend server running and healthy
- ✅ Frontend server running and accessible
- ✅ Database connection working
- ✅ Authentication flow working
- ✅ File upload working
- ✅ Syllabus parsing working

Your project is ready for development! 🎉

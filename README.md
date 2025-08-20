# Syllaparse

A simple, modern fullstack application built with Next.js and FastAPI.

## 📁 Project Structure

```
syllaparse/
├── frontend/          # Next.js app
│   └── src/app/
├── backend/           # FastAPI app
│   └── app/
└── setup-dev.sh      # Script for initial setup
```

## 🚀 Quick Start

1. **Run setup**

   ```bash
   ./setup-dev.sh
   ```

2. **Start backend**

   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

3. **Start frontend**

   ```bash
   cd frontend
   npm run dev
   ```

4. **View API Documentation**
   - API docs: http://localhost:8000/docs

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Database**: PostgreSQL

## 📄 License

MIT

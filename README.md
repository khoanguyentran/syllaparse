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

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Google Cloud account with Cloud Storage enabled

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd syllaparse
./setup-dev.sh
```

### 2. Configure Google Cloud Credentials

**For individual developers:**

```bash
./setup-credentials.sh
```

Then follow the instructions to:

- Download your Google Cloud service account key
- Place it in the `credentials/` folder
- Update your `.env` file with your project details

**For team members working on the same Google Cloud project:**
See [TEAM_SETUP.md](./TEAM_SETUP.md) for shared project setup.

### 3. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

### 5. View Application

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Database**: PostgreSQL

## 📄 License

MIT

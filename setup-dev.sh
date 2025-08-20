#!/bin/bash

echo "================================================"
echo "Setting up development environment..."
echo "================================================"

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Setup frontend
cd frontend
npm install
cd ..

echo "Open two terminals (one for backend, one for frontend)"
echo "To start the backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "To start the frontend: cd frontend && npm run dev"

# Expense Tracker

Full-stack expense tracker with:

- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** React + Vite

## Requirements

- Python 3.10+
- Node.js 18+ and npm

## Project Structure

- `main.py` - FastAPI backend entrypoint
- `frontend/` - React frontend app

## Backend Setup

Install Python dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Run backend from project root:

```bash
python3 -m uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`  
API docs: `http://127.0.0.1:8000/docs`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Run Both (Recommended)

Use two terminals:

Terminal 1 (backend):

```bash
cd expense-tracker
python3 -m uvicorn main:app --reload
```

Terminal 2 (frontend):

```bash
cd expense-tracker/frontend
npm run dev
```

## API Endpoints

- `GET /` - Health check
- `POST /expenses` - Create an expense
- `GET /expenses` - List all expenses
- `GET /expenses/{expense_id}` - Get one expense by ID
- `DELETE /expenses/{expense_id}` - Delete one expense by ID

## Example Request Body

```json
{
  "title": "Lunch",
  "amount": 12.5,
  "category": "Food"
}
```

## Notes

- Backend CORS allows frontend origin: `http://localhost:5173`
- If the frontend cannot call backend, ensure both apps are running and use `localhost:5173` for frontend.

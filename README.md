# Expense Tracker API

Simple FastAPI project to create, list, fetch, and delete expenses using SQLite.

## Requirements

- Python 3.10+
- pip

## Setup

```bash
python3 -m pip install -r requirements.txt
```

## Run

```bash
python3 -m uvicorn main:app --reload
```

App runs at: `http://127.0.0.1:8000`

## API Endpoints

- `GET /` - Health check
- `POST /expenses` - Create an expense
- `GET /expenses` - List all expenses
- `GET /expenses/{expense_id}` - Get one expense by ID
- `DELETE /expenses/{expense_id}` - Delete one expense by ID

## Example JSON (Create Expense)

```json
{
  "title": "Lunch",
  "amount": 12.5,
  "category": "Food"
}
```

## Quick Test

Open docs in browser:

- `http://127.0.0.1:8000/docs`

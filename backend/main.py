from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .services.ai_categorizer import categorize_expense

from .database import SessionLocal, engine
from . import models, schemas
from backend.routes.ai import router as ai_router


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

app.include_router(ai_router, prefix="/api", tags=["AI"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def health_check():
    return {"status": "Expense Tracker API is running"}


# @app.post("/expenses", response_model=schemas.ExpenseResponse)
# def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
#     db_expense = models.Expense(**expense.dict())
#     db.add(db_expense)
#     db.commit()
#     db.refresh(db_expense)
#     return db_expense

@app.post("/expenses", response_model=schemas.ExpenseResponse)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    category = expense.category

    if not category:
        category = categorize_expense(expense.title)

    db_expense = models.Expense(
        title=expense.title,
        amount=expense.amount,
        category=category
    )

    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses", response_model=List[schemas.ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).all()


@app.get("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}

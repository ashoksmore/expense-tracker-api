from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None


class ExpenseResponse(ExpenseCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

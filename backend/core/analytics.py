from __future__ import annotations

from sqlalchemy.orm import Session

from backend.models import Expense


def compute_spending_summary(db: Session) -> dict:
    expenses = db.query(Expense).all()

    if not expenses:
        return {"total": 0, "by_category": {}, "count": 0, "expenses": []}

    total_raw = sum(float(expense.amount) for expense in expenses)
    total = round(total_raw, 2)
    count = len(expenses)
    avg_expense = round(total_raw / count, 2)

    category_totals: dict[str, float] = {}
    for expense in expenses:
        category = expense.category or "Uncategorized"
        category_totals[category] = category_totals.get(category, 0.0) + float(expense.amount)

    by_category = {
        category: round(amount, 2)
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    }

    largest_expense = max(expenses, key=lambda expense: float(expense.amount))
    largest = {
        "title": largest_expense.title,
        "amount": round(float(largest_expense.amount), 2),
        "category": largest_expense.category,
    }

    expenses_list = [
        {
            "id": expense.id,
            "title": expense.title,
            "amount": round(float(expense.amount), 2),
            "category": expense.category,
            "created_at": (
                expense.created_at.isoformat() if expense.created_at is not None else None
            ),
        }
        for expense in expenses
    ]

    return {
        "total": total,
        "by_category": by_category,
        "count": count,
        "avg_expense": avg_expense,
        "largest": largest,
        "expenses": expenses_list,
    }


def parse_expense_hint(text: str) -> dict:
    if not text.strip():
        raise ValueError("Expense hint text must not be empty.")

    return {
        "raw_text": text,
        "word_count": len(text.split()),
    }

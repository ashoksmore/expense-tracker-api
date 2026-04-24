import json
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.analytics import compute_spending_summary
from backend.database import get_db

router = APIRouter(prefix="/ai", tags=["ai"])

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

VALID_CATEGORIES = {
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Health",
    "Housing",
    "Utilities",
    "Other",
}


class ParseRequest(BaseModel):
    text: str


class InsightRequest(BaseModel):
    question: str = "Summarize my spending"


class CategoryRequest(BaseModel):
    title: str


def ask_ollama(prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    try:
        response = httpx.post(OLLAMA_URL, json=payload, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        return str(data.get("response", "")).strip()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. Is Ollama running? Run: ollama serve",
        ) from exc


@router.get("/status")
def ai_status():
    try:
        response = httpx.get("http://127.0.0.1:11434/api/tags", timeout=5.0)
        response.raise_for_status()
        return {"ollama_connected": True, "model": OLLAMA_MODEL}
    except Exception:
        return {"ollama_connected": False, "model": OLLAMA_MODEL}


@router.post("/parse-expense")
def parse_expense(request: ParseRequest):
    prompt = (
        "You are an expense parser. Extract expense details from natural language.\n"
        "Return ONLY valid JSON with exactly these keys:\n"
        "title (string), amount (float), category (string).\n"
        "Category must be one of: Food, Transport, Shopping,\n"
        "Entertainment, Health, Housing, Utilities, Other.\n"
        "If amount not found, use 0.\n"
        "No explanation, no markdown, just the JSON object."
        f"\n\nText to parse: {request.text}"
    )
    ollama_response = ask_ollama(prompt)

    try:
        parsed = json.loads(ollama_response)
    except json.JSONDecodeError:
        return {
            "title": request.text,
            "amount": 0,
            "category": "Other",
            "parse_error": True,
        }

    return {
        **parsed,
        "raw_input": request.text,
        "parsed_by": "llama3.2",
    }


@router.post("/insights")
def get_ai_insights(request: InsightRequest, db: Session = Depends(get_db)):
    facts = compute_spending_summary(db)
    if not facts.get("count"):
        return {"answer": "No expenses recorded yet. Add some expenses first!"}

    prompt = (
        "You are a personal finance assistant analyzing expense data.\n"
        "Answer the question using ONLY the data provided below.\n"
        "Be concise - maximum 4 sentences.\n"
        "End with one practical tip starting with 'Tip:'.\n\n"
        "Expense summary data:\n"
        f"{json.dumps(facts, indent=2)}\n\n"
        f"Question: {request.question}"
    )
    answer = ask_ollama(prompt)
    return {"answer": answer, "based_on_expenses": facts["count"]}


@router.get("/monthly-summary")
def get_monthly_summary(db: Session = Depends(get_db)):
    facts = compute_spending_summary(db)
    if not facts.get("count"):
        return {"summary": "No expenses to summarize yet."}

    prompt = (
        "You are a personal finance assistant. Write a 3-sentence monthly\n"
        "spending summary based on this data. Be specific with numbers.\n"
        "End with one actionable recommendation.\n"
        f"Data: {json.dumps(facts)}"
    )
    summary = ask_ollama(prompt)
    top_category = next(iter(facts["by_category"]), "None")

    return {
        "summary": summary,
        "total_spend": facts["total"],
        "top_category": top_category,
    }


@router.post("/suggest-category")
def suggest_category(request: CategoryRequest):
    prompt = (
        "You are an expense categorizer. Given this expense title,\n"
        "respond with ONLY one word - the best category from this list:\n"
        "Food, Transport, Shopping, Entertainment, Health, Housing, Utilities, Other.\n"
        "No explanation. One word only.\n"
        f"Expense title: {request.title}"
    )
    response = ask_ollama(prompt).strip()
    first_word = response.split()[0] if response else ""
    cleaned_response = first_word.title()
    if cleaned_response not in VALID_CATEGORIES:
        cleaned_response = "Other"

    return {"category": cleaned_response, "title": request.title}

import os
import json
from typing import Optional

try:
    import openai  # pyright: ignore[reportMissingImports]
except ImportError:
    openai = None

if openai is not None:
    openai.api_key = os.getenv("OPENAI_API_KEY")

ALLOWED_CATEGORIES = [
    "Food",
    "Transport",
    "Groceries",
    "Utilities",
    "Entertainment",
    "Travel",
    "Health",
    "Work",
    "Other",
    "basic"
]

SYSTEM_PROMPT = """
You are a financial assistant.
Your task is to categorize expenses.

Rules:
- Choose ONLY from the allowed categories.
- If unsure, choose "Other".
- Respond ONLY in valid JSON.
"""

def categorize_expense(title: str) -> Optional[str]:
    if openai is None:
        return "Other"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            temperature=0,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"""
Expense description: "{title}"

Allowed categories:
{ALLOWED_CATEGORIES}

Respond in this format:
{{ "category": "<category>" }}
"""
                }
            ]
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)
        category = parsed.get("category")

        if category in ALLOWED_CATEGORIES:
            return category

        return "Other"

    except Exception:
        return "Other"

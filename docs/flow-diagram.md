# Expense Tracker flow diagrams

The **same diagrams** are embedded in the root [`README.md`](../README.md) so they show inline on GitHub. This file is a convenient copy when browsing `docs/`.

## System context

```mermaid
flowchart LR
    U[User in browser]
    FE[React + Vite]
    API[FastAPI]
    DB[(SQLite)]
    AI[LLM Groq or Ollama]

    U -->|Uses app| FE
    FE -->|REST /expenses, /categories| API
    API -->|CRUD| DB
    DB -->|Rows| API
    API -->|JSON| FE

    U -->|AI panel| FE
    FE -->|/api/ai/*| API
    API -->|Prompt + inference| AI
    AI -->|Text / JSON| API
    API -->|Responses| FE
```

## Creating an expense from the UI

```mermaid
sequenceDiagram
    participant U as Browser
    participant FE as React UI
    participant API as FastAPI
    participant DB as SQLite
    U->>FE: Submit title, amount, category
    FE->>API: POST /expenses
    API->>DB: INSERT expense
    DB-->>API: saved row
    API-->>FE: Expense JSON
    FE-->>U: Refresh list and charts
```

## Notes

- Analytics (`total`, `by_category`, etc.) are computed in backend core logic from stored expenses.
- AI endpoints use the configured LLM provider (e.g. Groq or Ollama) with safe fallbacks.
- The frontend supports demo data loading and local budget tracking for quick testing.

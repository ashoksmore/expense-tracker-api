# Expense Tracker Flow Diagram

```mermaid
flowchart LR
    U[User in Browser]
    FE[React + Vite Frontend]
    API[FastAPI Backend]
    DB[(SQLite expenses.db)]
    AI[Ollama Local Model]

    U -->|Add/View expenses| FE
    FE -->|REST calls /expenses| API
    API -->|CRUD operations| DB
    DB -->|Expense records| API
    API -->|JSON responses| FE

    U -->|AI actions in panel| FE
    FE -->|/api/ai/parse-expense| API
    FE -->|/api/ai/insights| API
    FE -->|/api/ai/monthly-summary| API
    FE -->|/api/ai/suggest-category| API
    FE -->|/api/ai/status| API

    API -->|Prompt + inference request| AI
    AI -->|Model response| API
    API -->|AI answer + computed analytics| FE
```

## Quick Notes

- Analytics (`total`, `by_category`, `largest`, `avg`) are deterministic and computed in backend core logic.
- AI endpoints use Ollama for parsing and narrative insights while the backend enforces safe fallbacks.
- The frontend also supports demo data loading and local budget tracking for quick testing.

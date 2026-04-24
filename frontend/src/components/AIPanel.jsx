import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const quickQuestions = [
  "Where am I overspending?",
  "What's my biggest expense?",
  "How can I save money?",
];

const chipStyle = {
  border: "1px solid #d5e2f5",
  background: "#f4f8ff",
  color: "#185FA5",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  cursor: "pointer",
};

export default function AIPanel({ expenses, onExpenseAdded }) {
  const [nlInput, setNlInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedExpense, setParsedExpense] = useState(null);
  const [question, setQuestion] = useState("");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");

  const handleParseExpense = async () => {
    if (!nlInput.trim()) return;
    setParsing(true);
    try {
      const response = await fetch(`${API_BASE}/ai/parse-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlInput }),
      });
      const result = await response.json();
      setParsedExpense(result);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmExpense = async () => {
    if (!parsedExpense) return;
    await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsedExpense.title,
        amount: parsedExpense.amount,
        category: parsedExpense.category,
      }),
    });
    setParsedExpense(null);
    setNlInput("");
    onExpenseAdded();
  };

  const handleInsight = async (overrideQuestion) => {
    setInsightLoading(true);
    try {
      const askedQuestion = overrideQuestion || question || "Summarize my spending";
      const response = await fetch(`${API_BASE}/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: askedQuestion }),
      });
      const result = await response.json();
      setInsight(result.answer || "");
    } finally {
      setInsightLoading(false);
    }
  };

  const handleSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ai/monthly-summary`);
      const result = await response.json();
      setSummary(result.summary || "");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSuggestCategory = async () => {
    if (!categoryInput.trim()) return;
    const response = await fetch(`${API_BASE}/ai/suggest-category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: categoryInput }),
    });
    const result = await response.json();
    setSuggestedCategory(result.category || "");
  };

  void expenses;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: "12px",
        padding: "16px",
        marginTop: "16px",
      }}
    >
      <details open style={{ marginBottom: "14px" }}>
        <summary
          style={{
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          Natural Language Entry
        </summary>
        <span
          style={{
            display: "inline-block",
            fontSize: "11px",
            background: "#e8f2ff",
            color: "#185FA5",
            borderRadius: "999px",
            padding: "3px 8px",
            marginBottom: "10px",
          }}
        >
          AI powered
        </span>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <input
            placeholder="e.g. spent $12 on lunch with team"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParseExpense()}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #dcdcdc", borderRadius: "8px" }}
          />
          <button
            type="button"
            onClick={handleParseExpense}
            disabled={parsing}
            style={{
              border: "none",
              background: "#185FA5",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            {parsing ? "Parsing..." : "Parse"}
          </button>
        </div>

        {parsedExpense && (
          <div
            style={{
              marginTop: "12px",
              background: "#f0f7ff",
              border: "1px solid #b3d4ff",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <strong>{parsedExpense.title}</strong>
            </div>
            <div style={{ marginBottom: "8px" }}>
              ${Number(parsedExpense.amount || 0).toFixed(2)}
            </div>
            <span
              style={{
                display: "inline-block",
                background: "#e6eef8",
                color: "#185FA5",
                borderRadius: "999px",
                padding: "3px 9px",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              {parsedExpense.category || "Other"}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleConfirmExpense}
                style={{
                  border: "none",
                  background: "#185FA5",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Add Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setNlInput(parsedExpense.title || "");
                  setParsedExpense(null);
                }}
                style={{
                  border: "1px solid #cfcfcf",
                  background: "#f3f3f3",
                  color: "#333",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </details>

      <details open style={{ marginBottom: "14px" }}>
        <summary
          style={{
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          Ask About Your Spending
        </summary>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
          {quickQuestions.map((chip) => (
            <button
              key={chip}
              type="button"
              style={chipStyle}
              onClick={() => {
                setQuestion(chip);
                handleInsight(chip);
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            placeholder="Ask a question about your spending"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #dcdcdc", borderRadius: "8px" }}
          />
          <button
            type="button"
            onClick={() => handleInsight()}
            style={{
              border: "none",
              background: "#185FA5",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Ask
          </button>
        </div>

        {insightLoading && (
          <div style={{ marginTop: "10px", color: "#777", fontStyle: "italic", fontSize: "13px" }}>
            Analyzing your expenses...
          </div>
        )}
        {insight && !insightLoading && (
          <div
            style={{
              marginTop: "10px",
              background: "#f5f5f5",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
            }}
          >
            {insight}
          </div>
        )}
      </details>

      <details open>
        <summary
          style={{
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          Monthly Summary
        </summary>

        <button
          type="button"
          onClick={handleSummary}
          style={{
            border: "none",
            background: "#185FA5",
            color: "#fff",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Generate Summary
        </button>

        {summaryLoading && <div style={{ fontSize: "13px", color: "#666" }}>Generating...</div>}
        {summary && !summaryLoading && (
          <blockquote
            style={{
              margin: 0,
              borderLeft: "3px solid #185FA5",
              paddingLeft: "12px",
              fontSize: "13px",
              lineHeight: 1.7,
              color: "#333",
            }}
          >
            {summary}
          </blockquote>
        )}

        <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
          <input
            placeholder="Type expense title for category suggestion"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #dcdcdc", borderRadius: "8px" }}
          />
          <button
            type="button"
            onClick={handleSuggestCategory}
            style={{
              border: "1px solid #cfcfcf",
              background: "#f8f8f8",
              color: "#333",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Suggest Category
          </button>
        </div>
        {suggestedCategory && (
          <div style={{ marginTop: "8px", fontSize: "13px", color: "#333" }}>
            Suggested category: <strong>{suggestedCategory}</strong>
          </div>
        )}
      </details>
    </div>
  );
}

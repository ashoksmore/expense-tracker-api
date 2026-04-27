import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const VALID_TABS = ["parse", "insights", "summary"];

const quickQuestions = [
  "Where am I overspending?",
  "What's my biggest expense?",
  "How can I save money?",
];

const panelStyle = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "16px",
};

export default function AIPanel({ expenses, onExpenseAdded }) {
  const [activeTab, setActiveTab] = useState("parse");
  const [aiStatus, setAiStatus] = useState({ loading: true, connected: false, model: "llama3.2" });

  const [nlInput, setNlInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedExpense, setParsedExpense] = useState(null);
  const [parseError, setParseError] = useState("");

  const [question, setQuestion] = useState("");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [categoryInput, setCategoryInput] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [toast, setToast] = useState("");

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshStatus = async () => {
    setAiStatus((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${API_BASE}/ai/status`);
      const result = await response.json();
      setAiStatus({
        loading: false,
        connected: Boolean(result.ollama_connected),
        model: result.model || "llama3.2",
      });
    } catch {
      setAiStatus({ loading: false, connected: false, model: "llama3.2" });
    }
  };

  const handleParseExpense = async () => {
    if (!nlInput.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const response = await fetch(`${API_BASE}/ai/parse-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlInput }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Unable to parse expense.");
      setParsedExpense(result);
    } catch (error) {
      setParseError(error.message || "Unable to parse expense.");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmExpense = async () => {
    if (!parsedExpense) return;
    try {
      const response = await fetch("http://127.0.0.1:8000/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedExpense.title,
          amount: parsedExpense.amount,
          category: parsedExpense.category,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Unable to add expense.");
      setParsedExpense(null);
      setNlInput("");
      onExpenseAdded();
      setToast("Expense added from AI parse.");
    } catch (error) {
      setParseError(error.message || "Unable to add expense.");
    }
  };

  const handleInsight = async (overrideQuestion) => {
    setInsightLoading(true);
    setInsightError("");
    try {
      const askedQuestion = overrideQuestion || question || "Summarize my spending";
      const response = await fetch(`${API_BASE}/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: askedQuestion }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Unable to get insight.");
      setInsight(result.answer || "");
    } catch (error) {
      setInsightError(error.message || "Unable to get insight.");
    } finally {
      setInsightLoading(false);
    }
  };

  const handleSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const response = await fetch(`${API_BASE}/ai/monthly-summary`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Unable to generate summary.");
      setSummary(result.summary || "");
    } catch (error) {
      setSummaryError(error.message || "Unable to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSuggestCategory = async () => {
    if (!categoryInput.trim()) return;
    setCategoryLoading(true);
    setCategoryError("");
    try {
      const response = await fetch(`${API_BASE}/ai/suggest-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: categoryInput }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Unable to suggest category.");
      setSuggestedCategory(result.category || "");
    } catch (error) {
      setCategoryError(error.message || "Unable to suggest category.");
    } finally {
      setCategoryLoading(false);
    }
  };

  void expenses;

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <strong style={{ fontSize: "14px" }}>AI Assistant</strong>
          <span
            style={{
              fontSize: "11px",
              borderRadius: "999px",
              padding: "3px 8px",
              background: aiStatus.connected ? "#e8f8ee" : "#fdecec",
              color: aiStatus.connected ? "#166534" : "#991b1b",
            }}
          >
            {aiStatus.loading ? "Checking..." : aiStatus.connected ? `Online (${aiStatus.model})` : "Offline"}
          </span>
        </div>
        <button
          type="button"
          onClick={refreshStatus}
          style={{
            border: "1px solid #d4d4d4",
            background: "#f8f8f8",
            color: "#333",
            borderRadius: "8px",
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          Refresh Status
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {VALID_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              border: activeTab === tab ? "1px solid #185FA5" : "1px solid #dcdcdc",
              background: activeTab === tab ? "#e9f2ff" : "#fff",
              color: activeTab === tab ? "#185FA5" : "#555",
              borderRadius: "999px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {tab === "parse" ? "Natural Language Entry" : tab === "insights" ? "Ask Insights" : "Monthly Summary"}
          </button>
        ))}
      </div>

      {activeTab === "parse" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              placeholder="e.g. spent $12 on lunch with team"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParseExpense()}
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #dcdcdc", borderRadius: "8px" }}
            />
            <button type="button" onClick={handleParseExpense} disabled={parsing}>
              {parsing ? "Parsing..." : "Parse"}
            </button>
          </div>
          {parseError && <p style={{ color: "#b91c1c", fontSize: "12px", margin: "0 0 10px 0" }}>{parseError}</p>}

          {parsedExpense && (
            <div
              style={{
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
              <div style={{ marginBottom: "8px" }}>${Number(parsedExpense.amount || 0).toFixed(2)}</div>
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
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={handleConfirmExpense}>
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
        </div>
      )}

      {activeTab === "insights" && (
        <div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            {quickQuestions.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setQuestion(chip);
                  handleInsight(chip);
                }}
                style={{
                  border: "1px solid #d5e2f5",
                  background: "#f4f8ff",
                  color: "#185FA5",
                  borderRadius: "999px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
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
            <button type="button" onClick={() => handleInsight()}>
              Ask
            </button>
          </div>
          {insightLoading && (
            <div style={{ marginTop: "10px", color: "#777", fontStyle: "italic", fontSize: "13px" }}>
              Analyzing your expenses...
            </div>
          )}
          {insightError && <p style={{ color: "#b91c1c", fontSize: "12px", marginTop: "10px" }}>{insightError}</p>}
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
        </div>
      )}

      {activeTab === "summary" && (
        <div>
          <button type="button" onClick={handleSummary} style={{ marginBottom: "10px" }}>
            Generate Summary
          </button>

          {summaryLoading && <div style={{ fontSize: "13px", color: "#666" }}>Generating...</div>}
          {summaryError && <p style={{ color: "#b91c1c", fontSize: "12px" }}>{summaryError}</p>}
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
            <button type="button" onClick={handleSuggestCategory} disabled={categoryLoading}>
              {categoryLoading ? "Checking..." : "Suggest Category"}
            </button>
          </div>
          {categoryError && <p style={{ color: "#b91c1c", fontSize: "12px", marginTop: "8px" }}>{categoryError}</p>}
          {suggestedCategory && (
            <div style={{ marginTop: "8px", fontSize: "13px", color: "#333" }}>
              Suggested category: <strong>{suggestedCategory}</strong>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div
          style={{
            marginTop: "12px",
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
            borderRadius: "8px",
            fontSize: "12px",
            padding: "8px 10px",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

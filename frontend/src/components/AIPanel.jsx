import { useEffect, useState } from "react";
import { formatCurrency } from "../format";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const VALID_TABS = ["parse", "insights", "summary"];

const quickQuestions = [
  "Where am I overspending?",
  "What's my biggest expense?",
  "How can I save money?",
];

export default function AIPanel({ expenses, onExpenseAdded }) {
  const [activeTab, setActiveTab] = useState("parse");
  const [aiStatus, setAiStatus] = useState({
    loading: true,
    connected: false,
    model: "llama3.2",
    provider: null,
  });

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
      const response = await fetch(`${API_BASE}/api/ai/status`);
      const result = await response.json();
      const connected =
        Boolean(result.ollama_connected) ||
        (result.provider === "groq" && Boolean(result.ready));
      setAiStatus({
        loading: false,
        connected,
        model: result.model || "llama3.2",
        provider: result.provider ?? null,
      });
    } catch {
      setAiStatus({ loading: false, connected: false, model: "llama3.2", provider: null });
    }
  };

  const handleParseExpense = async () => {
    if (!nlInput.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const response = await fetch(`${API_BASE}/api/ai/parse-expense`, {
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
      const response = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedExpense.title,
          amount: parsedExpense.amount,
          category: parsedExpense.category || "Other",
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
      const response = await fetch(`${API_BASE}/api/ai/insights`, {
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
      const response = await fetch(`${API_BASE}/api/ai/monthly-summary`);
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
      const response = await fetch(`${API_BASE}/api/ai/suggest-category`, {
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
    <div className="ai-panel">
      <div className="ai-panel__toolbar">
        <div className="ai-panel__title-row">
          <strong className="ai-panel__title">AI Assistant</strong>
          <span
            className={`ai-status ${
              aiStatus.loading ? "ai-status--pending" : aiStatus.connected ? "ai-status--ok" : "ai-status--off"
            }`}
          >
            {aiStatus.loading
              ? "Checking..."
              : aiStatus.connected
                ? aiStatus.provider === "groq"
                  ? `Online (Groq · ${aiStatus.model})`
                  : aiStatus.provider === "ollama"
                    ? `Online (Ollama · ${aiStatus.model})`
                    : `Online (${aiStatus.model})`
                : "Offline"}
          </span>
        </div>
        <button type="button" className="ai-panel__btn-ghost" onClick={refreshStatus}>
          Refresh Status
        </button>
      </div>

      <div className="ai-panel__tabs">
        {VALID_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`ai-tab${activeTab === tab ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "parse" ? "Natural Language Entry" : tab === "insights" ? "Ask Insights" : "Monthly Summary"}
          </button>
        ))}
      </div>

      {activeTab === "parse" && (
        <div>
          <div className="ai-panel__row">
            <input
              type="text"
              placeholder="e.g. spent $12 on lunch with team"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParseExpense()}
            />
            <button type="button" onClick={handleParseExpense} disabled={parsing}>
              {parsing ? "Parsing..." : "Parse"}
            </button>
          </div>
          {parseError && <p className="ai-error">{parseError}</p>}

          {parsedExpense && (
            <div className="ai-parse-card">
              <div style={{ marginBottom: "8px" }}>
                <strong>{parsedExpense.title}</strong>
              </div>
              <div style={{ marginBottom: "8px" }}>
                {formatCurrency(Number(parsedExpense.amount || 0))}
              </div>
              <span className="ai-pill">{parsedExpense.category || "Other"}</span>
              <div className="ai-panel__actions">
                <button type="button" onClick={handleConfirmExpense}>
                  Add Expense
                </button>
                <button
                  type="button"
                  className="ai-btn-secondary"
                  onClick={() => {
                    setNlInput(parsedExpense.title || "");
                    setParsedExpense(null);
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
          <div className="ai-panel__row ai-panel__row--chips">
            {quickQuestions.map((chip) => (
              <button
                key={chip}
                type="button"
                className="ai-chip"
                onClick={() => {
                  setQuestion(chip);
                  handleInsight(chip);
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="ai-panel__row">
            <input
              type="text"
              placeholder="Ask a question about your spending"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="button" onClick={() => handleInsight()}>
              Ask
            </button>
          </div>
          {insightLoading && <div className="ai-muted">Analyzing your expenses...</div>}
          {insightError && <p className="ai-error">{insightError}</p>}
          {insight && !insightLoading && <div className="ai-insight-box">{insight}</div>}
        </div>
      )}

      {activeTab === "summary" && (
        <div>
          <button type="button" className="ai-summary-trigger" onClick={handleSummary}>
            Generate Summary
          </button>

          {summaryLoading && <div className="ai-generating">Generating...</div>}
          {summaryError && <p className="ai-error">{summaryError}</p>}
          {summary && !summaryLoading && <blockquote className="ai-blockquote">{summary}</blockquote>}

          <div className="ai-panel__row" style={{ marginTop: "14px" }}>
            <input
              type="text"
              placeholder="Type expense title for category suggestion"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
            />
            <button type="button" onClick={handleSuggestCategory} disabled={categoryLoading}>
              {categoryLoading ? "Checking..." : "Suggest Category"}
            </button>
          </div>
          {categoryError && <p className="ai-error" style={{ marginTop: "8px" }}>{categoryError}</p>}
          {suggestedCategory && (
            <div className="ai-result">
              Suggested category: <strong>{suggestedCategory}</strong>
            </div>
          )}
        </div>
      )}

      {toast && <div className="ai-toast">{toast}</div>}
    </div>
  );
}

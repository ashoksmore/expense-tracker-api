import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getExpenses, getExpenseCategories, createExpense } from "./api";
import AIPanel from "./components/AIPanel";
import { EXPENSE_CATEGORIES as DEFAULT_CATEGORY_OPTIONS } from "./expenseCategories";
import "./styles.css";

function formatApiError(error) {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.message?.toLowerCase().includes("timeout")) {
      return "Request timed out while the server was starting. Try again—Render free tier can take up to a minute after sleep.";
    }
    if (!error.response) {
      return "Cannot reach the API. Check the network, CORS, and that VITE_API_URL matches your deployed backend.";
    }
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    return error.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [dataStatus, setDataStatus] = useState("loading");
  const [expensesRefreshing, setExpensesRefreshing] = useState(false);
  const [expensesError, setExpensesError] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS);
  const [budgets, setBudgets] = useState({});
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const fetchBootstrap = useCallback(async () => {
    setDataStatus("loading");
    setExpensesError(null);
    try {
      const [expRes, catRes] = await Promise.all([getExpenses(), getExpenseCategories()]);
      setExpenses(expRes.data);
      if (Array.isArray(catRes.data?.categories) && catRes.data.categories.length) {
        setCategoryOptions(catRes.data.categories);
        setCategory((c) => (catRes.data.categories.includes(c) ? c : "Other"));
      }
      setDataStatus("ready");
    } catch (e) {
      setExpensesError(formatApiError(e));
      setDataStatus("error");
    }
  }, []);

  useEffect(() => {
    void fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    const raw = window.localStorage.getItem("expenseBudgets");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setBudgets(parsed);
    } catch {
      setBudgets({});
    }
  }, []);

  const loadExpenses = async () => {
    if (dataStatus === "ready") setExpensesRefreshing(true);
    setExpensesError(null);
    try {
      const response = await getExpenses();
      setExpenses(response.data);
    } catch (e) {
      setExpensesError(formatApiError(e));
    } finally {
      setExpensesRefreshing(false);
    }
  };
  const fetchExpenses = loadExpenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createExpense({
      title,
      amount: parseFloat(amount),
      category: category.trim(),
    });
    setTitle("");
    setAmount("");
    setCategory("Other");
    loadExpenses();
  };

  const handleLoadDemoData = async () => {
    const demoExpenses = [
      { title: "Groceries - Whole Foods", amount: 96.45, category: "Food" },
      { title: "Monthly Metro Pass", amount: 72.0, category: "Transport" },
      { title: "Electricity Bill", amount: 58.2, category: "Utilities" },
      { title: "Netflix Subscription", amount: 14.99, category: "Entertainment" },
      { title: "Pharmacy", amount: 27.6, category: "Health" },
      { title: "Dinner with friends", amount: 44.3, category: "Food" },
      { title: "Online shopping", amount: 120.0, category: "Shopping" },
      { title: "Apartment Rent", amount: 850.0, category: "Housing" },
    ];

    const existing = await getExpenses();
    await Promise.all(
      existing.data.map((expense) =>
        fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/expenses/${expense.id}`, { method: "DELETE" }),
      ),
    );
    await Promise.all(
      demoExpenses.map((expense) =>
        createExpense({
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
        }),
      ),
    );
    loadExpenses();
  };

  const totalSpend = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const averageExpense = expenses.length ? totalSpend / expenses.length : 0;
  const topCategoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const topCategory = Object.entries(topCategoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  const categorySeries = Object.entries(topCategoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount: Number(amount) }));
  const maxCategoryAmount = categorySeries[0]?.amount || 1;
  const monthlyTotals = expenses.reduce((acc, expense) => {
    const date = expense.created_at ? new Date(expense.created_at) : new Date();
    const monthLabel = date.toLocaleString("en-US", { month: "short", year: "numeric" });
    acc[monthLabel] = (acc[monthLabel] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const monthlySeries = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({ month, amount: Number(amount) }))
    .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
  const maxMonthlyAmount = Math.max(...monthlySeries.map((item) => item.amount), 1);
  const budgetRows = Object.keys({ ...topCategoryTotals, ...budgets })
    .sort()
    .map((category) => {
      const spent = Number(topCategoryTotals[category] || 0);
      const budget = Number(budgets[category] || 0);
      const percent = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
      return { category, spent, budget, percent };
    });
  const alerts = budgetRows.filter((row) => row.budget > 0 && row.spent > row.budget);
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );

  const saveBudget = () => {
    const category = budgetCategory.trim();
    const amountValue = Number(budgetAmount);
    if (!category || Number.isNaN(amountValue) || amountValue <= 0) return;
    const next = { ...budgets, [category]: amountValue };
    setBudgets(next);
    window.localStorage.setItem("expenseBudgets", JSON.stringify(next));
    setBudgetCategory("");
    setBudgetAmount("");
  };

  const removeBudget = (category) => {
    const next = { ...budgets };
    delete next[category];
    setBudgets(next);
    window.localStorage.setItem("expenseBudgets", JSON.stringify(next));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Tracker</h1>
        <p className="app-subtitle">Track spending, budgets, and AI-powered insights.</p>
      </header>

      {dataStatus === "loading" && (
        <div className="api-load-banner api-load-banner--pending" role="status" aria-live="polite">
          <strong>Connecting to your data…</strong>
          <span>
            The hosted API can take <strong>30–60 seconds</strong> the first time after idle (Render
            spins services down). Expenses and categories load together—this is normal, not a broken
            page.
          </span>
        </div>
      )}

      {dataStatus === "error" && expensesError && (
        <div className="api-load-banner api-load-banner--error" role="alert">
          <p>{expensesError}</p>
          <div className="api-load-banner__actions">
            <button type="button" className="ghost-button" onClick={() => void fetchBootstrap()}>
              Retry
            </button>
          </div>
        </div>
      )}

      {dataStatus === "ready" && expensesError && (
        <div className="api-load-banner api-load-banner--error api-load-banner--inline" role="alert">
          <p>{expensesError}</p>
          <div className="api-load-banner__actions">
            <button type="button" className="ghost-button" onClick={() => void loadExpenses()}>
              Retry refresh
            </button>
          </div>
        </div>
      )}

      {dataStatus === "ready" && expensesRefreshing && !expensesError && (
        <p className="app-refresh-hint">Updating expenses…</p>
      )}

      <form className="entry-form" onSubmit={handleSubmit}>
        <input
          placeholder="Expense title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {categoryOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button>Add Expense</button>
      </form>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <p className="card-label">Total Spend</p>
          <p className={`card-value ${dataStatus === "loading" ? "kpi-loading" : ""}`}>
            {dataStatus === "loading" ? "—" : `$${totalSpend.toFixed(2)}`}
          </p>
        </article>
        <article className="dashboard-card">
          <p className="card-label">Transactions</p>
          <p className={`card-value ${dataStatus === "loading" ? "kpi-loading" : ""}`}>
            {dataStatus === "loading" ? "—" : expenses.length}
          </p>
        </article>
        <article className="dashboard-card">
          <p className="card-label">Average Expense</p>
          <p className={`card-value ${dataStatus === "loading" ? "kpi-loading" : ""}`}>
            {dataStatus === "loading" ? "—" : `$${averageExpense.toFixed(2)}`}
          </p>
        </article>
        <article className="dashboard-card">
          <p className="card-label">Top Category</p>
          <p className={`card-value ${dataStatus === "loading" ? "kpi-loading" : ""}`}>
            {dataStatus === "loading" ? "—" : topCategory}
          </p>
        </article>
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>Recent Transactions</h2>
          <button type="button" className="ghost-button" onClick={handleLoadDemoData}>
            Load Demo Data
          </button>
        </div>
        {sortedExpenses.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.title}</td>
                    <td>{expense.category || "Uncategorized"}</td>
                    <td>${Number(expense.amount || 0).toFixed(2)}</td>
                    <td>
                      {expense.created_at ? new Date(expense.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : dataStatus === "loading" ? (
          <p className="empty-state">Loading transactions…</p>
        ) : (
          <p className="empty-state">No expenses yet. Add your first expense above.</p>
        )}
      </section>

      <section className="chart-grid">
        <article className="table-section">
          <div className="table-header">
            <h2>Category Breakdown</h2>
          </div>
          {categorySeries.length ? (
            <div className="bar-chart-list">
              {categorySeries.map((item) => {
                const percent = Math.round((item.amount / maxCategoryAmount) * 100);
                return (
                  <div className="bar-row" key={item.category}>
                    <div className="bar-meta">
                      <span>{item.category}</span>
                      <strong>${item.amount.toFixed(2)}</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : dataStatus === "loading" ? (
            <p className="empty-state">Loading category breakdown…</p>
          ) : (
            <p className="empty-state">No category data yet.</p>
          )}
        </article>

        <article className="table-section">
          <div className="table-header">
            <h2>Monthly Spend Trend</h2>
          </div>
          {monthlySeries.length ? (
            <div className="mini-chart">
              {monthlySeries.map((item) => {
                const height = Math.max(12, Math.round((item.amount / maxMonthlyAmount) * 120));
                return (
                  <div className="mini-chart-col" key={item.month}>
                    <div className="mini-bar-wrap">
                      <div className="mini-bar" style={{ height: `${height}px` }} />
                    </div>
                    <span className="mini-label">{item.month.split(" ")[0]}</span>
                    <span className="mini-value">${item.amount.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          ) : dataStatus === "loading" ? (
            <p className="empty-state">Loading monthly trend…</p>
          ) : (
            <p className="empty-state">No monthly data yet.</p>
          )}
        </article>
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>Budget Tracking</h2>
        </div>

        <div className="budget-form">
          <input
            placeholder="Category (e.g. Food)"
            value={budgetCategory}
            onChange={(e) => setBudgetCategory(e.target.value)}
          />
          <input
            placeholder="Monthly budget"
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
          />
          <button type="button" onClick={saveBudget}>
            Save Budget
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="alert-list">
            {alerts.map((item) => (
              <p key={item.category} className="alert-item">
                Alert: {item.category} is over budget by ${(item.spent - item.budget).toFixed(2)}.
              </p>
            ))}
          </div>
        )}

        {budgetRows.length ? (
          <div className="budget-list">
            {budgetRows.map((item) => (
              <div key={item.category} className="budget-row">
                <div className="bar-meta">
                  <span>{item.category}</span>
                  {item.budget > 0 ? (
                    <strong>
                      ${item.spent.toFixed(2)} / ${item.budget.toFixed(2)}
                    </strong>
                  ) : (
                    <strong>${item.spent.toFixed(2)} / No budget</strong>
                  )}
                </div>
                <div className="bar-track budget-track">
                  {item.budget > 0 ? (
                    <div
                      className={`bar-fill ${item.spent > item.budget ? "bar-fill-danger" : ""}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  ) : (
                    <div className="bar-fill bar-fill-muted" style={{ width: "100%" }} />
                  )}
                </div>
                {item.budget > 0 && (
                  <button
                    type="button"
                    className="inline-link-button"
                    onClick={() => removeBudget(item.category)}
                  >
                    Remove Budget
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No budget data yet. Add a budget to start tracking.</p>
        )}
      </section>

      <AIPanel expenses={expenses} onExpenseAdded={fetchExpenses} />
    </div>
  );
}

export default App;

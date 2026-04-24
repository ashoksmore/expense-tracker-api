import { useEffect, useState } from "react";
import { getExpenses, createExpense } from "./api";
import AIPanel from "./components/AIPanel";
import "./styles.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const response = await getExpenses();
    setExpenses(response.data);
  };
  const fetchExpenses = loadExpenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createExpense({
      title,
      amount: parseFloat(amount),
    });
    setTitle("");
    setAmount("");
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
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );

  return (
    <div className="container">
      <h1>Expense Tracker</h1>

      <form onSubmit={handleSubmit}>
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
        <button>Add Expense</button>
      </form>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <p className="card-label">Total Spend</p>
          <p className="card-value">${totalSpend.toFixed(2)}</p>
        </article>
        <article className="dashboard-card">
          <p className="card-label">Transactions</p>
          <p className="card-value">{expenses.length}</p>
        </article>
        <article className="dashboard-card">
          <p className="card-label">Average Expense</p>
          <p className="card-value">${averageExpense.toFixed(2)}</p>
        </article>
        <article className="dashboard-card">
          <p className="card-label">Top Category</p>
          <p className="card-value">{topCategory}</p>
        </article>
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>Recent Transactions</h2>
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
        ) : (
          <p className="empty-state">No expenses yet. Add your first expense above.</p>
        )}
      </section>

      <AIPanel expenses={expenses} onExpenseAdded={fetchExpenses} />
    </div>
  );
}

export default App;

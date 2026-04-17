import { useEffect, useState } from "react";
import { getExpenses, createExpense } from "./api";
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

      <ul>
        {expenses.map((e) => (
          <li key={e.id}>
            {e.title} — ${e.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
``
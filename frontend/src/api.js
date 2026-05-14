import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/** Render free tier can cold-start 30–60s; avoid failing the UI too early. */
const API_TIMEOUT_MS = 90_000;

const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

export const getExpenses = () => api.get("/expenses");

export const getExpenseCategories = () => api.get("/categories");

export const createExpense = (expense) => api.post("/expenses", expense);

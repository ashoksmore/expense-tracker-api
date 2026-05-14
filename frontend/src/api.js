import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const getExpenses = () =>
  axios.get(`${API_BASE}/expenses`);

export const getExpenseCategories = () =>
  axios.get(`${API_BASE}/categories`);

export const createExpense = (expense) =>
  axios.post(`${API_BASE}/expenses`, expense);

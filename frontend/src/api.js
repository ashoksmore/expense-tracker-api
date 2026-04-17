import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const getExpenses = () =>
  axios.get(`${API_BASE}/expenses`);

export const createExpense = (expense) =>
  axios.post(`${API_BASE}/expenses`, expense);

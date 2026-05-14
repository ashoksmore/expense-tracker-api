/**
 * Mirror of backend/core/expense_categories.py — bootstrap the category
 * dropdown before GET /categories succeeds (e.g. slow network).
 * Keep lists identical when changing categories.
 */
export const EXPENSE_CATEGORIES = [
  "Entertainment",
  "Food",
  "Groceries",
  "Health",
  "Housing",
  "Shopping",
  "Transport",
  "Travel",
  "Utilities",
  "Work",
  "Other",
];

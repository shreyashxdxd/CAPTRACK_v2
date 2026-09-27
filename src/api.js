const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

export function registerUser(details) {
  return request("/auth/register", { method: "POST", body: details });
}

export function loginUser(credentials) {
  return request("/auth/login", { method: "POST", body: credentials });
}

export function loadAccount(token) {
  return request("/me", { token });
}

export function createExpense(token, expense) {
  return request("/expenses", { method: "POST", token, body: expense });
}

export function deleteExpense(token, expenseId) {
  return request(`/expenses/${expenseId}`, { method: "DELETE", token });
}

export function loadGoals(token) {
  return request("/goals", { token });
}

export function createGoal(token, goal) {
  return request("/goals", { method: "POST", token, body: goal });
}

export function deleteGoal(token, goalId) {
  return request(`/goals/${goalId}`, { method: "DELETE", token });
}

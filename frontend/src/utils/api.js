import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

export const endpoints = {
  projects: "/api/projects",
  projectStats: "/api/projects/stats",
  projectAnalytics: (id) => `/api/projects/${id}/analytics`,

  leads: "/api/leads",
  leadStats: "/api/leads/stats",
  leadAnalytics: (id) => `/api/leads/${id}/analytics`,

  employees: "/api/employees",
  employeeStats: "/api/employees/stats",
  employeeAnalytics: (id) => `/api/employees/${id}/analytics`,

  reports: "/api/reports",
  generateReport: "/api/reports/generate",

  deepDive: "/api/insights/deep-dive",
  aiCopilot: "/api/ai/copilot",

  health: "/health",
  metrics: "/api/metrics"
};

export const authHeaders = (session) => ({
  Authorization: `Bearer ${session?.access_token}`
});

export const fetchWithAuth = async (path, session, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(session),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
};

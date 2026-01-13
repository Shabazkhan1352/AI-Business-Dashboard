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

  health: "/health",
  info: "/api/info",
  metrics: "/api/metrics"
};

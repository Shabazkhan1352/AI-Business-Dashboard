import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { endpoints, fetchWithAuth } from '../utils/api';

const DataContext = createContext({
  metrics: null,
  projects: [],
  leads: [],
  employees: [],
  reports: [],
  deepDiveInsights: null,
  loading: true,
  error: null,
  refreshData: () => {},
  setDeepDiveInsights: () => {},
});

export const DataProvider = ({ children }) => {
  const { session } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deepDiveInsights, setDeepDiveInsights] = useState(null);

  const cache = useRef({ data: null, timestamp: null });

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000;
    if (!forceRefresh && cache.current.data && cache.current.timestamp && now - cache.current.timestamp < CACHE_DURATION) {
      const c = cache.current.data;
      setMetrics(c.metrics);
      setProjects(c.projects);
      setLeads(c.leads);
      setEmployees(c.employees);
      setReports(c.reports);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [metricsData, projectsData, leadsData, employeesData, reportsData] = await Promise.all([
        fetchWithAuth(endpoints.metrics, session),
        fetchWithAuth(endpoints.projects, session),
        fetchWithAuth(endpoints.leads, session),
        fetchWithAuth(endpoints.employees, session),
        fetchWithAuth(endpoints.reports, session),
      ]);

      const freshData = {
        metrics: metricsData?.database_metrics || null,
        projects: Array.isArray(projectsData) ? projectsData : [],
        leads: Array.isArray(leadsData) ? leadsData : [],
        employees: Array.isArray(employeesData) ? employeesData : [],
        reports: Array.isArray(reportsData) ? reportsData : [],
      };

      setMetrics(freshData.metrics);
      setProjects(freshData.projects);
      setLeads(freshData.leads);
      setEmployees(freshData.employees);
      setReports(freshData.reports);

      cache.current = { data: freshData, timestamp: Date.now() };
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData(false);
    } else {
      setLoading(false);
      setMetrics(null);
      setProjects([]);
      setLeads([]);
      setEmployees([]);
      setReports([]);
      cache.current = { data: null, timestamp: null };
    }
  }, [session, fetchData]);

  const refreshData = useCallback(() => fetchData(true), [fetchData]);

  return (
    <DataContext.Provider value={{ metrics, projects, leads, employees, reports, deepDiveInsights, loading, error, refreshData, setDeepDiveInsights }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

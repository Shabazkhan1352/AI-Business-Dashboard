// --- This is the complete, final, and OPTIMIZED version of your DataContext. ---
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

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
    
    // --- THIS IS THE OPTIMIZATION ---
    // We use a ref to store our cached data without causing re-renders.
    const cache = useRef({
        data: null,
        timestamp: null,
    });
    // --- END OPTIMIZATION ---

    const fetchData = useCallback(async (forceRefresh = false) => {
        // 1. Stop if the user is not logged in.
        if (!session?.access_token) {
            setLoading(false);
            return;
        }

        // --- CACHE CHECK ---
        const now = new Date().getTime();
        // Set cache to be valid for 5 minutes (300,000 milliseconds)
        const CACHE_DURATION = 300000; 

        // 2. If we are NOT forcing a refresh and the cache is still valid, use it!
        if (!forceRefresh && cache.current.data && cache.current.timestamp && (now - cache.current.timestamp < CACHE_DURATION)) {
            console.log("✅ Loading data from local cache. Fast!");
            const cachedData = cache.current.data;
            setMetrics(cachedData.metrics);
            setProjects(cachedData.projects);
            setLeads(cachedData.leads);
            setEmployees(cachedData.employees);
            setReports(cachedData.reports);
            setLoading(false);
            return; // Important: Stop execution here
        }
        // --- END CACHE CHECK ---

        console.log("🚀 Fetching fresh data from the server...");
        setLoading(true);
        setError(null);
        try {
            const token = session.access_token;
            const headers = { 'Authorization': `Bearer ${token}` };

            const [metricsRes, projectsRes, leadsRes, employeesRes, reportsRes] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/metrics", { headers }),
                fetch("http://127.0.0.1:8000/api/projects", { headers }),
                fetch("http://127.0.0.1:8000/api/leads", { headers }),
                fetch("http://127.0.0.1:8000/api/employees", { headers }),
                fetch("http://127.0.0.1:8000/api/reports", { headers }),
            ]);

            const responses = [metricsRes, projectsRes, leadsRes, employeesRes, reportsRes];
            for (const res of responses) {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ detail: `HTTP error! status: ${res.status}` }));
                    throw new Error(`API Error on ${res.url.split('/').pop()}: ${errorData.detail}`);
                }
            }

            const [metricsData, projectsData, leadsData, employeesData, reportsData] = await Promise.all(responses.map(res => res.json()));

            const freshData = {
                metrics: metricsData.database_metrics,
                projects: Array.isArray(projectsData) ? projectsData : [],
                leads: Array.isArray(leadsData) ? leadsData : [],
                employees: Array.isArray(employeesData) ? employeesData : [],
                reports: Array.isArray(reportsData) ? reportsData : [],
            };
            
            // 3. Populate the state with the new data
            setMetrics(freshData.metrics);
            setProjects(freshData.projects);
            setLeads(freshData.leads);
            setEmployees(freshData.employees);
            setReports(freshData.reports);

            // 4. Update our cache with the new data and timestamp
            cache.current.data = freshData;
            cache.current.timestamp = new Date().getTime();
            console.log("✅ Cache updated with fresh data.");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session]);

    // This useEffect handles the initial load. It will use the cache if available.
    useEffect(() => {
        if (session) {
            fetchData(false); // On initial load, don't force a refresh
        } else {
            setLoading(false);
            setMetrics(null); setProjects([]); setLeads([]); setEmployees([]); setReports([]);
            cache.current.data = null; // Clear cache on logout
        }
    }, [session, fetchData]);

    // The refreshData function will now ALWAYS force a refetch, bypassing the cache.
    // This ensures that when you add/edit/delete something, you always see the latest data.
    const refreshData = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    const value = { metrics, projects, leads, employees, reports, deepDiveInsights, loading, error, refreshData, setDeepDiveInsights };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
         throw new Error("useData must be used within a DataProvider");
    }
    return context;
};


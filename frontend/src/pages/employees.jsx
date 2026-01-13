// --- This is the complete, final, and refactored file for your Employees page. ---
// REPAIR: We no longer need useEffect or useState from React for data fetching.
// The complex charting imports remain unchanged.
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  LabelList,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Users2, Download, Award } from "lucide-react"; // FEATURE: Added Award icon for the new chart
// REPAIR: We import the useData hook to connect to our global context.
// FIX: Corrected the import path to resolve the module not found error.
import { useData } from '../contexts/DataContext';

// KPI Card component is unchanged.
const KPI = ({ title, value, sub }) => (
  <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10">
    <p className="text-sm text-gray-400">{String(title)}</p>
    <p className="text-2xl font-bold mt-1">{String(value)}</p>
    {sub ? <p className="text-xs text-gray-500 mt-1">{String(sub)}</p> : null}
  </div>
);

// FEATURE: A new component for the "Top Employees" chart.
const TopEmployeesChart = ({ data }) => (
    <div className="xl:col-span-12 bg-gray-800/50 rounded-2xl border border-white/10 p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Award className="mr-2 text-amber-400" /> Top 5 Employees by Efficiency
        </h2>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" width={120} tick={{ fontSize: 12 }} />
                    <RTooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
                        labelStyle={{ color: "#e5e7eb" }}
                        formatter={(value) => [`${value.toFixed(0)}%`, "Efficiency"]}
                    />
                    <Bar dataKey="efficiency" fill="url(#topEmployeeGradient)" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="efficiency" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#cbd5e1" fontSize={12} />
                    </Bar>
                    {/* Gradient definition for the bar color */}
                    <defs>
                        <linearGradient id="topEmployeeGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#facc15" stopOpacity={0.9}/>
                        </linearGradient>
                    </defs>
                </BarChart>
            </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-gray-400">
            Highlights the most efficient members of the team based on their performance data.
        </p>
    </div>
);


export default function EmployeesPage() {
  // REPAIR: All local state for data, loading, and errors is removed.
  // We now get this data directly from our "central brain", the DataContext.
  const { employees, loading, error } = useData();

  // KPIs (accurate) - This useMemo hook is unchanged.
  const kpis = useMemo(() => {
    if (!employees) return { total: 0, totalTasks: 0, avgEff: 0, available: 0, busy: 0, onLeave: 0 };
    const norm = (s) => (s || "").trim().toLowerCase();
    const total = employees.length;
    const totalTasks = employees.reduce((s, e) => s + Number(e.tasks_completed || 0), 0);
    const avgEff =
      total === 0
        ? 0
        : Math.round(
            (employees.reduce((s, e) => s + Number(e.efficiency || 0), 0) / total) * 100
          );
    const available = employees.reduce((n, e) => n + (norm(e.availability) === "available"), 0);
    const busy = employees.reduce((n, e) => n + (norm(e.availability) === "busy"), 0);
    const onLeave = employees.reduce((n, e) => n + (norm(e.availability) === "on leave"), 0);
    return { total, totalTasks, avgEff, available, busy, onLeave };
  }, [employees]);

  // Waterfall data - This useMemo hook is unchanged.
  const waterfall = useMemo(() => {
    if (!employees) return [];
    const byRole = new Map();
    employees.forEach((e) => {
      const role = e.role || "Unknown";
      const t = Number(e.tasks_completed || 0);
      byRole.set(role, (byRole.get(role) || 0) + t);
    });
    const total = [...byRole.values()].reduce((a, b) => a + b, 0);
    const rows = [...byRole.entries()]
      .map(([role, tasks]) => ({ role, tasks }))
      .sort((a, b) => b.tasks - a.tasks);
    let cum = 0;
    return rows.map((r) => {
      cum += r.tasks;
      const cumPct = total ? Math.round((cum / total) * 10000) / 100 : 0;
      return { role: r.role, tasks: r.tasks, cumPct };
    });
  }, [employees]);

  // Weekly productivity line - This useMemo hook is unchanged.
  const weekly = useMemo(() => {
    if (!employees) return [];
    const weeks = 12;
    const effs = employees.map((e) => Number(e.efficiency || 0) * 100);
    const base = effs.length ? effs.reduce((a, b) => a + b, 0) / effs.length : 0;
    return Array.from({ length: weeks }, (_, i) => {
      const delta = Math.sin((i + 1) * 0.75) * 3 + Math.cos((i + 3) * 0.45) * 1.5;
      const val = Math.max(0, Math.min(100, Math.round(base + delta)));
      return { week: `W${i + 1}`, efficiency: val };
    });
  }, [employees]);
  
  // FEATURE: New memo hook to calculate data for the Top 5 Employees chart.
  const topEmployees = useMemo(() => {
      if (!employees) return [];
      return [...employees]
        .sort((a, b) => (Number(b.efficiency) || 0) - (Number(a.efficiency) || 0))
        .slice(0, 5)
        .map(e => ({
            name: e.name,
            efficiency: (Number(e.efficiency) || 0) * 100,
        }));
  }, [employees]);

  // The exportCSV function is unchanged. It will now use the global 'employees' array.
  const exportCSV = () => {
    if (!employees || employees.length === 0) {
      alert("No employees to export.");
      return;
    }
    const headers = ["name", "role", "tasks_completed", "efficiency", "availability", "email", "manager"];
    const rows = [
      headers.join(","),
      ...employees.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header section is unchanged */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Users2 className="mr-3" /> Employees
          </h1>
          <p className="text-gray-400 mt-2">
            Premium workload waterfall and weekly productivity trend with a precise roster.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportCSV}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPIs section is unchanged */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <KPI title="Total" value={kpis.total} sub="People" />
        <KPI title="Total Tasks" value={kpis.totalTasks.toLocaleString("en-US")} sub="All roles" />
        <KPI title="Avg Efficiency" value={`${kpis.avgEff}%`} sub="Team average" />
        <KPI title="Available" value={kpis.available} />
        <KPI title="Busy" value={kpis.busy} />
        <KPI title="On Leave" value={kpis.onLeave} />
      </div>

      {/* Charts section is now a 3-column grid to accommodate the new chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Waterfall (Pareto) */}
        <div className="xl:col-span-6 bg-gray-800/50 rounded-2xl border border-white/10 p-4">
          <h2 className="text-lg font-semibold mb-3">Roles Workload (Pareto)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfall} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis 
                  dataKey="role" 
                  stroke="#9ca3af" 
                  interval={0} 
                  angle={-35} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 11 }} 
                />
                <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(v) => `${v}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                <RTooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#e5e7eb" }}
                  formatter={(val, name) =>
                    name === "cumPct" ? [`${Number(val).toFixed(2)}%`, "Cumulative"] : [Number(val).toLocaleString("en-US"), "Tasks"]
                  }
                />
                <Bar yAxisId="left" dataKey="tasks" fill="#10b981" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="tasks" position="top" formatter={(v) => Number(v).toLocaleString("en-US")} fill="#cbd5e1" fontSize={11} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Bars show tasks per role; gold line shows cumulative percentage to highlight top contributors. 80% marker aids quick Pareto read.
          </p>
        </div>

        {/* Weekly Productivity */}
        <div className="xl:col-span-6 bg-gray-800/50 rounded-2xl border border-white/10 p-4">
          <h2 className="text-lg font-semibold mb-3">Weekly Productivity (Avg Efficiency)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <RTooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#e5e7eb" }}
                  formatter={(value) => [`${Number(value).toFixed(2)}%`, "Avg Efficiency"]}
                />
                <Line type="monotone" dataKey="efficiency" stroke="#60a5fa" strokeWidth={3} dot={{ r: 3 }} />
                <ReferenceLine y={kpis.avgEff} stroke="#94a3b8" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Line shows weekly average efficiency; the dashed band marks current team average as a benchmark for quick comparison.
          </p>
        </div>
        
        {/* FEATURE: The new TopEmployeesChart is added to the layout */}
        <TopEmployeesChart data={topEmployees} />
        
      </div>

      {/* Roster Table */}
      <div className="mt-6 bg-gray-800/50 rounded-2xl border border-white/10 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">Employee Roster</h2>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: "58vh", minHeight: 200 }}>
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading employees from global context...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">{error}</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 font-semibold text-white sticky top-0 bg-gray-800/70 backdrop-blur-sm">Name</th>
                  <th className="p-4 font-semibold text-white sticky top-0 bg-gray-800/70 backdrop-blur-sm">Role</th>
                  <th className="p-4 font-semibold text-white text-right sticky top-0 bg-gray-800/70 backdrop-blur-sm">Tasks</th>
                  <th className="p-4 font-semibold text-white text-right sticky top-0 bg-gray-800/70 backdrop-blur-sm">Efficiency</th>
                  <th className="p-4 font-semibold text-white sticky top-0 bg-gray-800/70 backdrop-blur-sm">Availability</th>
                  <th className="p-4 font-semibold text-white sticky top-0 bg-gray-800/70 backdrop-blur-sm">Manager</th>
                </tr>
              </thead>
              <tbody>
                {(employees || []).map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-semibold text-white">{String(e.name ?? "")}</td>
                    <td className="p-4">{String(e.role ?? "")}</td>
                    <td className="p-4 text-right text-gray-300">
                      {Number(e.tasks_completed ?? 0).toLocaleString("en-US")}
                    </td>
                    <td className="p-4 text-right text-gray-300">
                      {`${(Number(e.efficiency ?? 0) * 100).toFixed(0)}%`}
                    </td>
                    <td className="p-4 text-gray-300">{String(e.availability ?? "")}</td>
                    <td className="p-4 text-gray-300">{String(e.manager ?? "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


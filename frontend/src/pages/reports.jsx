// --- This is the complete, final, and fully functional file for your Reports page. ---
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FileBarChart2, PlusCircle, X, RefreshCw, Trash2, Search } from "lucide-react";
// FIX: Corrected import paths to remove the file extension, which is the standard for Next.js projects.
import { useData } from "../contexts/DataContext";
import { API_BASE_URL, endpoints } from '../utils/api';
import { useAuth } from "../contexts/AuthContext";

const STATUS_COLORS = { Success: "#34d399", Pending: "#fbbf24", Failed: "#f87171", default: "#94a3b8" };

const KPI = ({ title, value, sub }) => (
  <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10">
    <p className="text-sm text-gray-400">{String(title)}</p>
    <p className="text-2xl font-bold mt-1">{String(value)}</p>
    {sub ? <p className="text-xs text-gray-500 mt-1">{String(sub)}</p> : null}
  </div>
);

const GenerateReportModal = ({ isOpen, onClose, onReportGenerated }) => {
    const { session } = useAuth();
    const [reportName, setReportName] = useState('');
    const [reportType, setReportType] = useState('Executive Summary');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reportName) { setSubmitError("Report name is required."); return; }
        setIsSubmitting(true);
        setSubmitError(null);

        if (!session?.access_token) {
            setSubmitError("Authentication error. Please log in again.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoints.generateReport}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ name: reportName, type: reportType }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate report.');
            }
            onReportGenerated();
            onClose();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-6">Generate New Report</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reportName" className="block text-sm font-medium text-gray-300">Report Name</label>
                        <input type="text" id="reportName" value={reportName} onChange={(e) => setReportName(e.target.value)}
                            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" placeholder="e.g., Q3 Executive Summary" />
                    </div>
                    <div>
                        <label htmlFor="reportType" className="block text-sm font-medium text-gray-300">Report Type</label>
                        <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value)}
                            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2">
                            <option>Executive Summary</option>
                            <option>Project Health</option>
                            <option>Leads & Sales</option>
                        </select>
                    </div>
                    {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
                    <div className="pt-4">
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                            {isSubmitting ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function ReportsPage() {
  const { reports, loading, error, refreshData } = useData();
  const { session } = useAuth(); // Needed for delete
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State for the delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { totals, donutStatus, donutType, lastDate } = useMemo(() => {
    if (!reports) return { totals: {}, donutStatus: [], donutType: [], lastDate: "-" };
    const norm = (s) => (s || "").trim();
    const total = reports.length;
    const successes = reports.filter((r) => norm(r.status) === "Success").length;
    const failed = reports.filter((r) => norm(r.status) === "Failed").length;
    const pending = reports.filter((r) => norm(r.status) === "Pending").length;
    const successRate = total ? Math.round((successes / total) * 100) : 0;
    
    const statusMap = new Map();
    reports.forEach((r) => { const k = norm(r.status); if(k) statusMap.set(k, (statusMap.get(k) || 0) + 1); });
    const donutStatusData = [...statusMap.entries()].map(([name, value]) => ({ name, value }));
    
    const typeMap = new Map();
    reports.forEach((r) => { const k = norm(r.type); if(k) typeMap.set(k, (typeMap.get(k) || 0) + 1); });
    const donutTypeData = [...typeMap.entries()].map(([name, value]) => ({ name, value }));

    let last = null;
    reports.forEach((r) => { const d = new Date(r.generated_on); if (!Number.isNaN(d.getTime())) { if (!last || d > last) last = d; } });
    
    return { totals: { total, successes, failed, pending, successRate }, donutStatus: donutStatusData, donutType: donutTypeData, lastDate: last ? last.toISOString().slice(0, 10) : "-" };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!searchTerm || !reports) return reports || [];
    return reports.filter(report =>
        (report.name && report.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.type && report.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [reports, searchTerm]);

  const openDeleteModal = (report) => {
    setDeletingReport(report);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setDeletingReport(null);
    setIsDeleteModalOpen(false);
    setSubmitError(null);
  };
  
  const handleDelete = async () => {
    if (!deletingReport || !session?.access_token) {
        setSubmitError("Cannot delete report. Authentication or selection error.");
        return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoints.reports}/${deletingReport.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to delete report.');
        }
        refreshData();
        closeDeleteModal();
    } catch (err) {
        setSubmitError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div>
      <GenerateReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onReportGenerated={refreshData} />
      
      {/* FEATURE: Delete confirmation modal */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
                  <p className="text-sm text-gray-300 mb-4">
                      Are you sure you want to delete the report: <strong className="font-bold text-white">{deletingReport?.name}</strong>? This action cannot be undone.
                  </p>
                  {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}
                  <div className="flex justify-end space-x-4">
                      <button onClick={closeDeleteModal} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold">Cancel</button>
                      <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold disabled:bg-gray-500">
                          {isSubmitting ? 'Deleting...' : 'Delete'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><FileBarChart2 className="mr-3" /> Reports</h1>
          <p className="text-gray-400 mt-2">Generate, view, and manage executive summaries of business performance.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center"><PlusCircle className="mr-2 h-4 w-4" /> Generate Report</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KPI title="Total Reports" value={totals.total ?? 0} sub="All types" />
        <KPI title="Success Rate" value={`${totals.successRate ?? 0}%`} sub={`Last run • ${lastDate}`} />
        <KPI title="Success" value={totals.successes ?? 0} />
        <KPI title="Pending" value={totals.pending ?? 0} />
        <KPI title="Failed" value={totals.failed ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 bg-gray-800/50 rounded-2xl border border-white/10 p-4">
          <h2 className="text-lg font-semibold mb-3">Status Overview</h2>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><RTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} /><Pie data={donutStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none" >{donutStatus.map((d, i) => ( <Cell key={`cell-${i}`} fill={STATUS_COLORS[d.name] || STATUS_COLORS.default} /> ))}</Pie></PieChart></ResponsiveContainer></div>
        </div>
        <div className="xl:col-span-7 bg-gray-800/50 rounded-2xl border border-white/10 p-4">
            <h2 className="text-lg font-semibold">Reports by Type</h2>
            <p className="text-xs text-gray-400 mb-3">Volume of generated reports.</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donutType} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" interval={0} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" />
                  <RTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
      
      <div className="mt-6 bg-gray-800/50 rounded-2xl border border-white/10 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          {/* FEATURE: Search and Refresh controls */}
          <div className="flex items-center space-x-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-900/50 border border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <button onClick={refreshData} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md" title="Refresh Report List">
                <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: "58vh", minHeight: 200 }}>
          {loading ? ( <div className="p-12 text-center text-gray-400">Loading reports...</div> ) :
           error ? ( <div className="p-12 text-center text-red-400">{error}</div> ) :
           (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 font-semibold text-white text-left">Report</th>
                  <th className="p-4 font-semibold text-white text-left">Type</th>
                  <th className="p-4 font-semibold text-white text-left">Generated By</th>
                  <th className="p-4 font-semibold text-white text-left">Date</th>
                  <th className="p-4 font-semibold text-white text-left">Status</th>
                  <th className="p-4 font-semibold text-white text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredReports || []).map((r) => (
                  <tr key={r.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5">
                    <td className="p-4 font-semibold text-white">{r.name || ""}</td>
                    <td className="p-4 text-gray-300">{r.type || ""}</td>
                    <td className="p-4 text-gray-300">{r.generated_by || ""}</td>
                    <td className="p-4 text-gray-300">{r.generated_on || ""}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ r.status === "Success" ? "bg-green-500/20 text-green-300" : r.status === "Pending" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300" }`} >{r.status || ""}</span></td>
                    <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                           <button onClick={() => window.open(r.download_url, '_blank')} disabled={r.status !== 'Success'} className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm disabled:bg-gray-500 disabled:cursor-not-allowed" >Open</button>
                           <button onClick={() => openDeleteModal(r)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                    </td>
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


// --- This is the complete, final, and fully redesigned file for your main Dashboard. ---
import React, { useMemo, useState, useCallback } from "react";
import { DollarSign, Briefcase, Users, Zap, BrainCircuit, TrendingUp, AlertTriangle, Target, CheckCircle, ListTodo } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, FunnelChart, Funnel, LabelList, Sector } from "recharts";
// FIX: Corrected the import paths to remove the file extension, which is the standard for Next.js projects.
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

// --- Reusable UI Components ---

const KpiCard = ({ title, value, icon: Icon, iconBgColor }) => (
    <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-3xl font-bold mt-2">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${iconBgColor}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    </div>
);

// REVERT: Restoring the original, simpler DeepDiveInsightCard component as requested.
const DeepDiveInsightCard = ({ title, observation, recommendation, icon: Icon }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
        <div className="flex items-center mb-2">
            <Icon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
            <h4 className="font-bold text-white text-md">{title}</h4>
        </div>
        <div className="pl-8">
            <p className="text-gray-300 text-sm"><span className="font-semibold text-gray-100">Observation:</span> {observation}</p>
            {/* This handles both old and new recommendation formats */}
            {recommendation && <p className="text-gray-300 text-sm mt-1"><span className="font-semibold text-gray-100">Recommendation:</span> {recommendation}</p>}
        </div>
    </div>
);


// FEATURE: Custom shape for the interactive pie chart segment.
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`${value} Projects`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


// --- Main Dashboard Component ---
export default function Dashboard() {
    const { session } = useAuth();
    const { metrics, projects, leads, loading, error, deepDiveInsights, setDeepDiveInsights } = useData();
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = useCallback((_, index) => {
        setActiveIndex(index);
    }, [setActiveIndex]);
    
    // --- Data Processing for Charts ---
    const chartData = useMemo(() => {
        if (loading || error || !projects || !leads) {
            return { projectStatus: [], leadStages: [], atRiskProjects: [], highValueLeads: [] };
        }

        const projectStatusMap = projects.reduce((acc, p) => {
            const status = p.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const projectStatus = Object.entries(projectStatusMap).map(([name, value]) => ({ name, value }));
        
        const leadStageOrder = ["Prospect", "Qualified", "Negotiation", "Won"];
        const leadStagesMap = leads.reduce((acc, l) => {
            const stage = l.stage || "Unknown";
            acc[stage] = (acc[stage] || 0) + 1;
            return acc;
        }, {});
        const leadStages = leadStageOrder.map(stage => ({ name: stage, value: leadStagesMap[stage] || 0, fill: `url(#funnelGradient${stage})`})).filter(item => item.value > 0);

        const atRiskProjects = projects.filter(p => p.status === 'At Risk').sort((a, b) => (b.budget || 0) - (a.budget || 0)).slice(0, 5);
        const highValueLeads = leads.filter(l => l.status === 'Active').sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5);

        return { projectStatus, leadStages, atRiskProjects, highValueLeads };
    }, [loading, error, projects, leads]);

    const [isGenerating, setIsGenerating] = useState(false);
    const handleGenerateDeepDive = async () => {
        setIsGenerating(true);
        setDeepDiveInsights(null);
        try {
            if (!session) throw new Error("Authentication error.");
            const response = await fetch("http://127.0.0.1:8000/api/insights/deep-dive", {
                method: "POST",
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Failed to fetch AI insights.");
            setDeepDiveInsights(data);
        } catch (err) {
            setDeepDiveInsights({ error: err.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const formatCurrency = (value) => (value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const PROJECT_STATUS_COLORS = { "On Track": "#22c55e", "At Risk": "#f59e0b", "Delayed": "#ef4444", "Completed": "#3b82f6" };
    
    return (
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 80px)'}}>
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">AI Business Dashboard</h1>
                    <p className="text-gray-400 mt-2">Live business overview with intelligent metrics and AI analysis.</p>
                </div>
            </div>

            {loading ? <div className="text-center text-gray-400 p-8">Loading dashboard data...</div> : 
             error ? <div className="text-center text-rose-400 p-8 bg-rose-900/30 rounded-lg"><p className="font-bold">Error:</p><p>{error}</p></div> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard title="Total Revenue" value={formatCurrency(metrics?.lead_stats?.total_revenue)} icon={DollarSign} iconBgColor="bg-green-500/30" />
                        <KpiCard title="Active Projects" value={metrics?.project_stats?.active_projects ?? '0'} icon={Briefcase} iconBgColor="bg-blue-500/30" />
                        <KpiCard title="Team Members" value={metrics?.employee_stats?.total_employees ?? '0'} icon={Users} iconBgColor="bg-purple-500/30" />
                        <KpiCard title="Conversion Rate" value={`${metrics?.lead_stats?.conversion_rate ?? '0'}%`} icon={Zap} iconBgColor="bg-orange-500/30" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Project Status</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie activeIndex={activeIndex} activeShape={renderActiveShape} data={chartData.projectStatus} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" onMouseEnter={onPieEnter}>
                                            {chartData.projectStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={PROJECT_STATUS_COLORS[entry.name] || '#8884d8'} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Sales Funnel</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <FunnelChart>
                                        <defs>
                                            <linearGradient id="funnelGradientProspect" x1="0" y1="0" x2="1" y2="0"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8}/></linearGradient>
                                            <linearGradient id="funnelGradientQualified" x1="0" y1="0" x2="1" y2="0"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0.8}/></linearGradient>
                                            <linearGradient id="funnelGradientNegotiation" x1="0" y1="0" x2="1" y2="0"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0.8}/></linearGradient>
                                            <linearGradient id="funnelGradientWon" x1="0" y1="0" x2="1" y2="0"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#34d399" stopOpacity={0.8}/></linearGradient>
                                        </defs>
                                        <RTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                        <Funnel dataKey="value" data={chartData.leadStages} isAnimationActive>
                                            <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                                        </Funnel>
                                    </FunnelChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                         <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><AlertTriangle className="mr-3 text-amber-400" /> Top At-Risk Projects</h3>
                            <ul className="space-y-3">{chartData.atRiskProjects.map(p => (<li key={p.id} className="text-sm"><p className="font-medium text-gray-200">{p.name}</p><p className="text-gray-400">Client: {p.client}</p></li>))}</ul>
                        </div>
                         <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><Target className="mr-3 text-green-400" /> Highest Value Leads</h3>
                            <ul className="space-y-3">{chartData.highValueLeads.map(l => (<li key={l.id} className="text-sm"><p className="font-medium text-gray-200">{l.name}</p><p className="text-gray-400">Value: {formatCurrency(l.value)}</p></li>))}</ul>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-center">
                             <button onClick={handleGenerateDeepDive} disabled={isGenerating || loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-blue-500/50">
                                <BrainCircuit className="h-5 w-5 mr-3" />
                                {isGenerating ? "Analyzing..." : "Generate Deep Dive Analysis"}
                            </button>
                        </div>
                         {(isGenerating || deepDiveInsights) && (
                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 mt-8">
                                <div className="flex items-center mb-4">
                                    <BrainCircuit className="h-8 w-8 text-blue-400 mr-4" />
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">Gemini Deep Dive Analysis</h3>
                                        <p className="text-gray-400 text-sm">A comprehensive business overview powered by Google AI</p>
                                    </div>
                                </div>
                                {isGenerating && <div className="text-center p-8 text-gray-300">Contacting Google AI... Please wait.</div>}
                                {deepDiveInsights?.error && <div className="text-rose-400 p-4 bg-rose-900/50 rounded-lg">{deepDiveInsights.error}</div>}
                                {deepDiveInsights && !deepDiveInsights.error && (
                                    <div>
                                        <p className="text-gray-200 mb-4 p-4 bg-gray-900/70 rounded-lg italic text-center">"{deepDiveInsights.executive_summary}"</p>
                                        <div className="space-y-4">
                                            <DeepDiveInsightCard {...deepDiveInsights.project_analysis} icon={Briefcase} />
                                            <DeepDiveInsightCard {...deepDiveInsights.sales_analysis} icon={TrendingUp} />
                                            <DeepDiveInsightCard {...deepDiveInsights.workforce_analysis} icon={Users} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


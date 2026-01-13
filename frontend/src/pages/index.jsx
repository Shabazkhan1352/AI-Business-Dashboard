import React from 'react';
import { DollarSign, Briefcase, Users, Zap } from 'lucide-react';

// --- Reusable UI Components ---
// These helper components are defined here for clarity. In a larger application,
// they could be moved to their own files inside the `src/components` directory.

/**
 * A card component to display a Key Performance Indicator (KPI).
 */
const KPI = ({ title, value, change, icon: Icon, iconBgColor }) => (
  <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{change}</p>
      </div>
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

/**
 * A container card for displaying charts.
 */
const ChartCard = ({ title, children }) => (
  <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 mt-8">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    {children}
  </div>
);

/**
 * A specialized card for displaying AI-generated insights.
 */
const AiInsightCard = ({ title, content, type }) => {
  const color = type === 'alert' ? 'border-yellow-500' : 'border-red-500';
  const icon = type === 'alert' ? '⚠️' : '🔥';
  return (
    <div className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${color} mb-4`}>
      <h4 className="font-bold text-white">{icon} {title}</h4>
      <p className="text-gray-300 text-sm mt-1">{content}</p>
    </div>
  );
};


// --- Main Dashboard Page Component ---
export default function DashboardPage() {
  // Static data for the KPI cards, based on your project mockups.
  // Later, this data will be fetched from the `/api/dashboard/stats` endpoint.
  const kpiData = [
    { title: 'Total Revenue', value: '$124,563', change: '+12.5%', icon: DollarSign, iconBgColor: 'bg-green-500/30' },
    { title: 'Active Projects', value: '28', change: '+3.2%', icon: Briefcase, iconBgColor: 'bg-blue-500/30' },
    { title: 'Team Members', value: '156', change: '+8.1%', icon: Users, iconBgColor: 'bg-purple-500/30' },
    { title: 'Conversion Rate', value: '24.8%', change: '-2.4%', icon: Zap, iconBgColor: 'bg-orange-500/30' },
  ];

  return (
    <>
      {/* Header Section with Title and Action Buttons */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Business Dashboard</h1>
          <p className="text-gray-400 mt-2">Monitor your business performance and get AI-powered insights.</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Export Data</button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Generate Report</button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => <KPI key={index} {...kpi} />)}
      </div>

      {/* Main Content Area with Charts and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column for Charts */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend">
            <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">[Revenue Chart Goes Here]</p>
            </div>
          </ChartCard>
        </div>

        {/* Right Column for AI Insights */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 h-full mt-8 lg:mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              <button className="text-blue-400 text-sm font-semibold">Refresh</button>
            </div>
            <AiInsightCard 
              type="alert" 
              title="Performance Alert" 
              content="Marketing ROI has increased by 23% this month, driven by LinkedIn campaigns." 
            />
            <AiInsightCard 
              type="risk" 
              title="Risk Detection" 
              content="3 projects are approaching their deadlines with completion below 70%." 
            />
          </div>
        </div>
      </div>
    </>
  );
}


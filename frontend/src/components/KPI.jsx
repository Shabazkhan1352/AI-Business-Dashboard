import React from 'react';
export const KPI = ({ title, value, change, icon: Icon, iconBgColor }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
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
export default KPI;
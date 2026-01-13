import React from 'react';
export const ChartCard = ({ title, children }) => (
    <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10 mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        {children}
    </div>
);
export default ChartCard;
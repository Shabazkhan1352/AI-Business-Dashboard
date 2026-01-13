import React from 'react';
export const AiInsightCard = ({ title, content, type }) => {
    const color = type === 'alert' ? 'border-yellow-500' : 'border-red-500';
    const icon = type === 'alert' ? '⚠️' : '🔥';
    return (
        <div className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${color} mb-4`}>
            <h4 className="font-bold text-white">{icon} {title}</h4>
            <p className="text-gray-300 text-sm mt-1">{content}</p>
        </div>
    );
};
export default AiInsightCard;
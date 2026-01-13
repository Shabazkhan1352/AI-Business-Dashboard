// File: src/components/DataTable.jsx
import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

const DataTable = ({ data, columns, emptyMessage = "No data available" }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <div className="w-4 h-4" />; // Placeholder for alignment
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-400" />
      : <ChevronDown className="w-4 h-4 text-blue-400" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <MoreHorizontal className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleSort(column.key)}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors select-none"
              >
                <div className="flex items-center justify-between">
                  <span>{column.label}</span>
                  {getSortIcon(column.key)}
                </div>
              </th>
            ))}
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-white/5">
          {sortedData.map((row, index) => (
            <tr 
              key={row.id || index}
              className="hover:bg-white/5 transition-colors duration-150"
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                  {column.render 
                    ? column.render(row[column.key], row)
                    : <span className="text-sm text-gray-300">{row[column.key]}</span>
                  }
                </td>
              ))}
              
              {/* Actions column */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
import React from 'react';
import PerformanceChart from '../../components/dashboard/teacher/PerformanceChart';

const mockChartData = {
  weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  studentScores: [80, 85, 78, 90, 88, 92],
  classAverages: [75, 80, 77, 85, 83, 87],
};

const ProgressPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <input
            type="text"
            placeholder="Search by child or subject..."
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">Filter</button>
        </div>
      </div>
      <PerformanceChart data={mockChartData} />
    </div>
  );
};

export default ProgressPage; 
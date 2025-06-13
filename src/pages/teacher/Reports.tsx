import React, { useState } from 'react';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const classStats = {
    totalStudents: 24,
    averageAttendance: 92.5,
    averageReadingLevel: 2.3,
    totalReadingSessions: 156,
    completedAssessments: 89,
    improvementRate: 15.2
  };

  const studentPerformance = [
    {
      id: 1,
      name: 'Emma Wilson',
      readingLevel: 2,
      progress: 85,
      attendance: 95,
      assessments: 8,
      avgScore: 88,
      trend: 'up'
    },
    {
      id: 2,
      name: 'Jack Davis',
      readingLevel: 1,
      progress: 65,
      attendance: 88,
      assessments: 6,
      avgScore: 72,
      trend: 'up'
    },
    {
      id: 3,
      name: 'Sarah Miller',
      readingLevel: 2,
      progress: 78,
      attendance: 92,
      assessments: 9,
      avgScore: 85,
      trend: 'stable'
    },
    {
      id: 4,
      name: 'Tim Wilson',
      readingLevel: 1,
      progress: 45,
      attendance: 85,
      assessments: 5,
      avgScore: 68,
      trend: 'down'
    }
  ];

  const monthlyData = [
    { month: 'Sep', readingLevel: 1.8, attendance: 89, assessments: 12 },
    { month: 'Oct', readingLevel: 1.9, attendance: 91, assessments: 15 },
    { month: 'Nov', readingLevel: 2.1, attendance: 93, assessments: 18 },
    { month: 'Dec', readingLevel: 2.2, attendance: 92, assessments: 14 },
    { month: 'Jan', readingLevel: 2.3, attendance: 92.5, assessments: 16 }
  ];

  const handleExportReport = (reportType: string) => {
    // showInfo('Export Report', `${reportType} report export will be available in the next update.`);
  };

  const handleGenerateReport = (reportType: string) => {
    // showInfo('Generate Report', `${reportType} report generation will be available in the next update.`);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <i className="fas fa-arrow-up text-green-500"></i>;
      case 'down':
        return <i className="fas fa-arrow-down text-red-500"></i>;
      case 'stable':
        return <i className="fas fa-minus text-gray-500"></i>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your class performance</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => handleExportReport('comprehensive')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-download mr-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedReport('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedReport === 'overview'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-chart-pie mr-2"></i>
            Overview
          </button>
          <button
            onClick={() => setSelectedReport('performance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedReport === 'performance'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-user-graduate mr-2"></i>
            Student Performance
          </button>
          <button
            onClick={() => setSelectedReport('attendance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedReport === 'attendance'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-calendar-check mr-2"></i>
            Attendance
          </button>
          <button
            onClick={() => setSelectedReport('assessments')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedReport === 'assessments'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-clipboard-check mr-2"></i>
            Assessments
          </button>
        </div>
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{classStats.totalStudents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Average Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{classStats.averageAttendance}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-book text-purple-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Avg Reading Level</p>
                  <p className="text-2xl font-bold text-gray-900">{classStats.averageReadingLevel}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Reading Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{classStats.totalReadingSessions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clipboard-check text-indigo-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{classStats.completedAssessments}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trending-up text-pink-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Improvement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">+{classStats.improvementRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Progress Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 w-12">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Reading Level</span>
                          <span>{data.readingLevel}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(data.readingLevel / 3) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Attendance</span>
                          <span>{data.attendance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${data.attendance}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Student Performance Report */}
      {selectedReport === 'performance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Student Performance Report</h2>
            <button
              onClick={() => handleGenerateReport('performance')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-file-alt mr-2"></i>
              Generate Report
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentPerformance.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Level {student.readingLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.attendance}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.assessments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.avgScore}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTrendIcon(student.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Report */}
      {selectedReport === 'attendance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Report</h2>
            <button
              onClick={() => handleGenerateReport('attendance')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-file-alt mr-2"></i>
              Generate Report
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <i className="fas fa-calendar-check text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Analytics</h3>
              <p className="text-gray-600 mb-4">Detailed attendance tracking and analysis will be available in the next update.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{classStats.averageAttendance}%</p>
                  <p className="text-sm text-gray-600">Average Attendance</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{classStats.totalStudents}</p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">156</p>
                  <p className="text-sm text-gray-600">Sessions This Period</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assessments Report */}
      {selectedReport === 'assessments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Assessment Report</h2>
            <button
              onClick={() => handleGenerateReport('assessments')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-file-alt mr-2"></i>
              Generate Report
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <i className="fas fa-clipboard-check text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Analytics</h3>
              <p className="text-gray-600 mb-4">Comprehensive assessment results and analysis will be available in the next update.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-indigo-600">{classStats.completedAssessments}</p>
                  <p className="text-sm text-gray-600">Completed Assessments</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-yellow-600">85%</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-pink-600">+{classStats.improvementRate}%</p>
                  <p className="text-sm text-gray-600">Improvement Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 
import React, { useState } from 'react';

const MakeTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedTestType, setSelectedTestType] = useState('comprehension');
  const [selectedLevel, setSelectedLevel] = useState('level2');

  const testTemplates = [
    {
      id: 1,
      name: 'Reading Comprehension - Level 2',
      type: 'comprehension',
      level: 'level2',
      questions: 10,
      duration: '30 min',
      lastUsed: '2024-01-10'
    },
    {
      id: 2,
      name: 'Vocabulary Assessment - Level 1',
      type: 'vocabulary',
      level: 'level1',
      questions: 15,
      duration: '25 min',
      lastUsed: '2024-01-08'
    },
    {
      id: 3,
      name: 'Fluency Test - Level 3',
      type: 'fluency',
      level: 'level3',
      questions: 5,
      duration: '20 min',
      lastUsed: '2024-01-12'
    }
  ];

  const recentTests = [
    {
      id: 1,
      name: 'Comprehension Test - Group A',
      type: 'comprehension',
      students: 8,
      date: '2024-01-15',
      status: 'completed',
      avgScore: 85
    },
    {
      id: 2,
      name: 'Vocabulary Quiz - Individual',
      type: 'vocabulary',
      students: 1,
      date: '2024-01-16',
      status: 'in-progress',
      avgScore: null
    },
    {
      id: 3,
      name: 'Fluency Assessment - Group B',
      type: 'fluency',
      students: 6,
      date: '2024-01-17',
      status: 'scheduled',
      avgScore: null
    }
  ];

  const handleCreateTest = async () => {
    // Remove all imports and usages of showSuccess, showConfirmation, showInfo, showError, and any SweetAlert-related logic.
    // Remove confirmation logic and let the code continue or return as needed.
    // Remove any code that references SweetAlert or the custom alert service.
  };

  const handleUseTemplate = async (templateId: number) => {
    // Remove all imports and usages of showSuccess, showConfirmation, showInfo, showError, and any SweetAlert-related logic.
    // Remove confirmation logic and let the code continue or return as needed.
    // Remove any code that references SweetAlert or the custom alert service.
  };

  const handleStartTest = async (testId: number) => {
    // Remove all imports and usages of showSuccess, showConfirmation, showInfo, showError, and any SweetAlert-related logic.
    // Remove confirmation logic and let the code continue or return as needed.
    // Remove any code that references SweetAlert or the custom alert service.
  };

  const handleViewResults = (testId: number) => {
    // Remove all imports and usages of showSuccess, showConfirmation, showInfo, showError, and any SweetAlert-related logic.
    // Remove confirmation logic and let the code continue or return as needed.
    // Remove any code that references SweetAlert or the custom alert service.
  };

  const getTestTypeColor = (type: string) => {
    // Remove all imports and usages of showSuccess, showConfirmation, showInfo, showError, and any SweetAlert-related logic.
    // Remove confirmation logic and let the code continue or return as needed.
    // Remove any code that references SweetAlert or the custom alert service.
    switch (type) {
      case 'comprehension':
        return 'bg-blue-100 text-blue-800';
      case 'vocabulary':
        return 'bg-green-100 text-green-800';
      case 'fluency':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    // Remove all imports and usages of showSuccess, showConfirmation, showInfo, showError, and any SweetAlert-related logic.
    // Remove confirmation logic and let the code continue or return as needed.
    // Remove any code that references SweetAlert or the custom alert service.
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Make a Test</h1>
          <p className="text-gray-600 mt-1">Create and manage reading assessments for your students</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateTest}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Create New Test
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create Test
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Test Templates
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent Tests
          </button>
        </nav>
      </div>

      {/* Create Test Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Assessment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type
                </label>
                <select
                  value={selectedTestType}
                  onChange={(e) => setSelectedTestType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="comprehension">Reading Comprehension</option>
                  <option value="vocabulary">Vocabulary Assessment</option>
                  <option value="fluency">Fluency Test</option>
                  <option value="phonics">Phonics Assessment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reading Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="level1">Independent</option>
                  <option value="level2">Instructional</option>
                  <option value="level3">Frustrational</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name
              </label>
              <input
                type="text"
                placeholder="Enter test name..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                rows={4}
                placeholder="Enter test instructions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCreateTest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Test Templates</h2>
          <div className="grid gap-4">
            {testTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestTypeColor(template.type)}`}>
                          {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {template.level}
                        </span>
                      </div>
                      <p><i className="fas fa-question-circle mr-2"></i>{template.questions} questions</p>
                      <p><i className="fas fa-clock mr-2"></i>Duration: {template.duration}</p>
                      <p><i className="fas fa-calendar mr-2"></i>Last used: {template.lastUsed}</p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tests Tab */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tests</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{test.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTestTypeColor(test.type)}`}>
                        {test.type.charAt(0).toUpperCase() + test.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.avgScore ? `${test.avgScore}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {test.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartTest(test.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Start Test"
                          >
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        {test.status === 'completed' && (
                          <button
                            onClick={() => handleViewResults(test.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Results"
                          >
                            <i className="fas fa-chart-bar"></i>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewResults(test.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeTest; 
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService, type Student } from '../../services/studentService';

// Mock Phil-IRI data for demonstration
const philIriLevels = ['Independent', 'Instructional', 'Frustration'] as const;
const philIriColors = {
  Independent: 'text-green-700 bg-green-100 border-green-200',
  Instructional: 'text-blue-700 bg-blue-100 border-blue-200',
  Frustration: 'text-red-700 bg-red-100 border-red-200',
};

const MiniPhilIriRing: React.FC<{ name: string; level: typeof philIriLevels[number] }> = ({ name, level }) => (
  <div className="w-full flex flex-row items-center bg-blue-50 rounded-xl border border-blue-100 shadow-xl p-5 gap-5 transition-shadow duration-200 hover:shadow-2xl justify-start">
    <div className={`w-14 h-14 aspect-square rounded-full flex items-center justify-center text-lg font-extrabold shadow-md ${philIriColors[level]}`}>{name[0]}</div>
    <div className="flex flex-col justify-center items-start">
      <span className="text-lg font-semibold text-gray-800 whitespace-nowrap">{name}</span>
      <span className={`mt-1 px-4 py-1 rounded-full text-sm font-bold shadow-sm ${philIriColors[level]}`}>{level}</span>
    </div>
  </div>
);

const PhilIriDonutChart: React.FC<{ levels: string[] }> = ({ levels }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const data = philIriLevels.map(lvl => ({
    value: levels.filter(l => l === lvl).length,
    name: lvl,
  }));
  useEffect(() => {
    import('echarts').then(echarts => {
      if (chartRef.current) {
        const chart = echarts.init(chartRef.current);
        const option = {
          tooltip: { trigger: 'item' },
          legend: { top: 'bottom' },
          series: [
            {
              name: 'Phil-IRI Levels',
              type: 'pie',
              radius: ['50%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
              label: { show: false },
              emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
              labelLine: { show: false },
              data,
            },
          ],
        };
        chart.setOption(option);
        const resizeHandler = () => chart.resize();
        window.addEventListener('resize', resizeHandler);
        return () => {
          window.removeEventListener('resize', resizeHandler);
          chart.dispose();
        };
      }
    });
  }, [levels]);
  return <div ref={chartRef} className="w-full h-56" />;
};

const StudentBarChart: React.FC<{ students: Student[] }> = ({ students }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const scores = students.map(_ => 60 + Math.round(Math.random() * 40));
  useEffect(() => {
    import('echarts').then(echarts => {
      if (chartRef.current) {
        const chart = echarts.init(chartRef.current);
        const option = {
          animation: true,
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '8%', top: 40, containLabel: true },
          xAxis: {
            type: 'category',
            data: students.map(s => s.name),
            axisLabel: { fontSize: 14, color: '#6b7280' },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
          },
          yAxis: {
            type: 'value',
            max: 100,
            min: 0,
            axisLabel: { fontSize: 14, color: '#6b7280', formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
          },
          series: [
            {
              data: scores,
              type: 'bar',
              barWidth: '40%',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#93c5fd' },
                  { offset: 1, color: '#38bdf8' }
                ]),
                borderRadius: [8, 8, 0, 0],
              },
              label: {
                show: true,
                position: 'top',
                formatter: '{c}%',
                color: '#2563eb',
                fontWeight: 'bold',
              },
            },
          ],
        };
        chart.setOption(option);
        const resizeHandler = () => chart.resize();
        window.addEventListener('resize', resizeHandler);
        return () => {
          window.removeEventListener('resize', resizeHandler);
          chart.dispose();
        };
      }
    });
  }, [students]);
  return <div ref={chartRef} className="w-full h-80" />;
};

const ProgressPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  // Use readingLevel as the Phil-IRI level, mapping to allowed values
  const philIriData = students.map(s => {
    const level = philIriLevels.includes(s.readingLevel as any)
      ? (s.readingLevel as typeof philIriLevels[number])
      : 'Independent';
    return {
      ...s,
      philIriLevel: level as typeof philIriLevels[number],
    };
  });
  const levels = philIriData.map(_ => _.philIriLevel);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const result = await studentService.getStudentsByParent(currentUser.uid);
        if (isMounted) setStudents(result);
      } catch {
        if (isMounted) setStudents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStudents();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  // Summary cards
  const totalAssessed = students.length;
  const avgLevelIdx = levels.length ? Math.round(levels.reduce((sum, l) => sum + philIriLevels.indexOf(l), 0) / levels.length) : 0;
  const avgLevel = philIriLevels[avgLevelIdx] || 'N/A';
  const mostImproved = students.length > 0 ? students[0].name : 'N/A';

  // Mock recent Phil-IRI activity
  const recentActivity = [
    'John Doe moved from Instructional to Independent (Week 6)',
    'Jane Smith improved comprehension score (Week 6)',
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Phil-IRI Progress</h2>
          <div className="text-gray-500 text-sm">Reading assessment overview for your children</div>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <span className="text-xs text-gray-400">Last updated: 2025-07-10 19:30</span>
          <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg shadow transition">Refresh</button>
        </div>
      </div>
      {/* Main Row: 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Left: Summary Card */}
        <div className="rounded-2xl p-6 shadow-md bg-blue-50 flex flex-col items-center justify-center min-h-[220px]">
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl font-extrabold text-blue-700">{totalAssessed}</span>
            <span className="text-lg font-semibold text-blue-700">Total Assessed</span>
            <span className="text-base text-blue-500">Avg Level: <span className="font-bold">{avgLevel}</span></span>
            <span className="text-xs text-blue-400">Most Improved: {mostImproved}</span>
          </div>
        </div>
        {/* Center: Donut Chart */}
        <div className="rounded-2xl p-6 shadow-md bg-white flex flex-col items-center justify-center min-h-[220px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Phil-IRI Level Distribution</h3>
          <PhilIriDonutChart levels={levels} />
        </div>
        {/* Right: Recent Activity */}
        <div className="rounded-2xl p-6 shadow-md bg-purple-50 flex flex-col min-h-[220px]">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">Recent Phil-IRI Activity</h3>
          <ul className="text-sm text-purple-700 list-disc pl-5">
            {recentActivity.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      {/* Mini Phil-IRI Progress Rings */}
      {philIriData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {philIriData.map(child => (
            <MiniPhilIriRing key={child.id} name={child.name} level={child.philIriLevel} />
          ))}
        </div>
      )}
      {/* Student Progress Bar Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Progress Overview</h3>
        {loading ? (
          <div className="text-blue-400 text-center py-10">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="text-blue-600 text-center py-10">No students linked to your account.</div>
        ) : (
          <StudentBarChart students={students} />
        )}
      </div>
    </div>
  );
};

export default ProgressPage; 
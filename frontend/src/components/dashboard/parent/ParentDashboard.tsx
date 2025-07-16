import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService, type Student } from '../../../services/studentService';
import * as echarts from 'echarts';

// Make all containers and cards transparent (no bg-* or shadow-* classes)
const chartCard = "relative bg-white rounded-2xl p-6 mb-6 w-full shadow-md";
const activityCard = "relative bg-white rounded-2xl p-6 mb-6 w-full shadow-md";
const addChildBtn = "mx-auto block mt-2 mb-6 px-6 py-2 rounded-full text-blue-600 font-semibold hover:bg-blue-100 transition";

const summaryCard = (gradient: string) => `relative ${gradient} bg-white/60 backdrop-blur-md rounded-xl p-4 flex flex-col justify-between min-h-[110px] shadow-md transition hover:scale-105 hover:shadow-lg`;

const FloatingIcon = ({ icon, colorClass = "bg-blue-100 border-blue-200", glowClass = "from-blue-200/70 via-blue-100/40 to-transparent" }: { icon: React.ReactNode; colorClass?: string; glowClass?: string }) => (
  <div className="absolute -top-9 right-7 z-20 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
    {/* Glow background */}
    <div className={`absolute inset-0 w-20 h-20 rounded-full blur-2xl opacity-80 z-0 bg-gradient-radial ${glowClass}`}></div>
    {/* Glassy icon container */}
    <div
      className={`relative w-16 h-16 flex items-center justify-center rounded-full border-2 ${colorClass} backdrop-blur-md bg-white/40 bg-opacity-60 shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl`}
      style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.12)' }}
    >
      {icon}
    </div>
  </div>
);

const OverviewCard = ({ title, value, icon, gradient, iconColorClass, glowClass }: { title: string; value: number | string; icon: React.ReactNode; gradient: string; iconColorClass?: string; glowClass?: string }) => (
  <div className={summaryCard(gradient) + " relative overflow-visible group"}>
    <FloatingIcon icon={icon} colorClass={iconColorClass} glowClass={glowClass} />
    <div className="flex flex-col justify-center flex-1 pt-2">
      <span className="text-sm font-semibold text-gray-700 mb-1">{title}</span>
      <span className="text-3xl font-extrabold text-gray-900">{value}</span>
    </div>
      </div>
);

const childrenCard = "relative bg-white rounded-xl p-6 mb-6 w-full shadow-md";

// ECharts-based bar chart for parent summary
const ParentChildrenBarChart: React.FC<{ children: Student[] }> = ({ children }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);
  // Mock average scores for each child
  const data = children.length > 0 ? children.map(child => ({
    name: child.name,
    avg: 60 + Math.round(Math.random() * 40),
  })) : [
    { name: 'No Data', avg: 0 }
  ];

  React.useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      const option = {
        animation: true,
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '8%', top: 40, containLabel: true },
        xAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLabel: { fontSize: 12, color: '#6b7280' },
          axisLine: { lineStyle: { color: '#e5e7eb' } },
        },
        yAxis: {
          type: 'value',
          max: 100,
          min: 0,
          axisLabel: { fontSize: 12, color: '#6b7280', formatter: '{value}%' },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        },
        series: [
          {
            data: data.map(d => d.avg),
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
  }, [children]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Children Average Scores</h3>
      <div ref={chartRef} className="w-full h-64 sm:h-72" />
    </div>
  );
};

const ParentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const students = await studentService.getStudentsByParent(currentUser.uid);
        if (isMounted) setChildren(students);
      } catch {
        if (isMounted) setChildren([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto min-h-screen pb-6">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-1 tracking-tight">Parent Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <OverviewCard 
          title="Children" 
          value={children.length} 
          gradient="bg-gradient-to-br from-blue-50 to-blue-100" 
          icon={<svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-5a4 4 0 11-8 0 4 4 0 018 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm-14 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
          iconColorClass="bg-blue-100 border-blue-200" 
          glowClass="from-blue-200/70 via-blue-100/40 to-transparent"
        />
        <OverviewCard 
          title="Reading Sessions" 
          value={0} 
          gradient="bg-gradient-to-br from-green-50 to-green-100" 
          icon={<svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7m0 0h8m-8 0H4" /></svg>} 
          iconColorClass="bg-green-100 border-green-200" 
          glowClass="from-green-200/70 via-green-100/40 to-transparent"
        />
        <OverviewCard 
          title="Test Results" 
          value={0} 
          gradient="bg-gradient-to-br from-purple-50 to-purple-100" 
          icon={<svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 018 0v2m-4-6a4 4 0 100-8 4 4 0 000 8zm6 8a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h2" /></svg>} 
          iconColorClass="bg-purple-100 border-purple-200" 
          glowClass="from-purple-200/70 via-purple-100/40 to-transparent"
        />
      </div>

      {/* Children Overview */}
      <div className={childrenCard + " group px-4"}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 tracking-wide pt-0">Children Overview</h3>
        {loading ? (
          <div className="animate-pulse text-blue-400 text-center py-6">Loading children...</div>
        ) : children.length === 0 ? (
          <>
            <p className="text-blue-600 text-base font-bold text-center mt-6">No children linked to your account yet.</p>
            <button className={addChildBtn}>Add Child</button>
          </>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {children.map(child => (
              <div key={child.id} className="bg-blue-50 rounded-xl shadow-lg border border-blue-100 p-6 flex flex-row items-center w-full mx-0 transition-all duration-200 hover:shadow-xl hover:bg-blue-100 hover:border-blue-200 group cursor-pointer">
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border border-blue-100 mr-6 transition-all duration-200 group-hover:scale-105 group-hover:border-blue-200 group-hover:shadow-sm">
                  <svg className="w-9 h-9 text-blue-300 transition-transform duration-200 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="font-bold text-blue-900 text-lg leading-tight truncate">{child.name}</div>
                  <div className="text-xs text-blue-500 font-medium mb-1 truncate">{child.grade}</div>
                  <div className="text-xs"><span className="text-blue-400 font-medium">Reading Level:</span> {child.readingLevel}</div>
                  <div className="text-xs flex items-center gap-1 mt-1">
                    <span className="text-blue-400 font-medium">Performance:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${child.performance === 'Excellent'
                        ? 'bg-green-100 text-green-700'
                        : child.performance === 'Good'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'}
                    `}>{child.performance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Bar Chart Card */}
      <div className={chartCard + " relative overflow-visible group"}>
        <ParentChildrenBarChart children={children} />
        </div>

      {/* Performance Chart Card */}
      {/* (Removed Students Performance section) */}

      {/* Recent Activity Card */}
      <div className={activityCard + " relative overflow-visible group"}>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 pt-0">Recent Activity</h3>
        <p className="text-blue-400 text-sm">No recent activity</p>
      </div>
    </div>
  );
};

export default ParentDashboard; 
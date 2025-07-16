import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService, type Student } from '../../../services/studentService';

// Mini progress ring (mocked for now)
const MiniProgressRing: React.FC<{ percent: number }> = ({ percent }) => (
  <svg className="w-20 h-8" viewBox="0 0 80 32">
    <rect x="2" y="2" width="76" height="28" rx="14" fill="#e0e7ff" />
    <rect
      x="2" y="2"
      width={0.76 * percent} // fill proportional to percent
      height="28"
      rx="14"
      fill="#6366f1"
    />
    <text x="40" y="21" textAnchor="middle" fontSize="14" fill="#6366f1" fontWeight="bold">{percent}%</text>
  </svg>
);

const philIriLevels = ['Independent', 'Instructional', 'Frustration'] as const;
const philIriColors = {
  Independent: 'bg-green-100 text-green-700',
  Instructional: 'bg-blue-100 text-blue-700',
  Frustration: 'bg-red-100 text-red-700',
};
const getRandomLevel = () => philIriLevels[Math.floor(Math.random() * philIriLevels.length)];

// Mocked parent tips
const parentTips = [
  "Ask your child about their favorite story this week!",
  "Celebrate small reading achievements together.",
  "Encourage daily reading, even for just 10 minutes.",
  "Discuss new words your child learned today.",
];

// Mocked badges
const mockBadges = [
  { label: "Perfect Score", color: "bg-yellow-100 text-yellow-700" },
  { label: "Most Improved", color: "bg-green-100 text-green-700" },
  { label: "Consistent Reader", color: "bg-blue-100 text-blue-700" },
];

// Mocked encouragements
const encouragements = [
  "Keep up the great reading! Every page counts.",
  "Your support makes a difference in your child's journey.",
  "Reading together builds memories and skills.",
  "Celebrate every milestone, big or small!",
];

// Reading Leaderboard
const ReadingLeaderboard: React.FC<{ children: Student[]; progress: (id: string) => number }> = ({ children, progress }) => {
  const sorted = [...children].sort((a, b) => progress(b.id || '') - progress(a.id || ''));
  return (
    <div className="bg-white border border-blue-100 rounded-xl shadow p-4 mb-8">
      <h4 className="text-base font-semibold text-blue-700 mb-3">Reading Leaderboard</h4>
      <ol className="divide-y divide-blue-50">
        {sorted.map((child, idx) => {
          const percent = progress(child.id || '');
          return (
            <li key={child.id} className="flex flex-row items-center py-3 gap-3">
              {/* Medal for top 3 */}
              {idx < 3 && (
                <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
              )}
              <span className="text-gray-900 whitespace-nowrap min-w-[120px] max-w-[180px] truncate">{child.name}</span>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shadow-sm whitespace-nowrap min-w-[110px] text-center">{child.grade}</span>
              <span className="ml-auto text-gray-700 text-sm whitespace-nowrap">{percent}%</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// Weekly Reading Activity Chart (mocked, bar chart)
const WeeklyReadingActivityChart: React.FC<{ children: Student[] }> = ({ children }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    import('echarts').then(echarts => {
      if (chartRef.current) {
        const chart = echarts.init(chartRef.current);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = children.map(child => ({
          name: child.name,
          sessions: days.map(() => Math.floor(Math.random() * 3)),
        }));
        const option = {
          tooltip: { trigger: 'axis' },
          legend: { data: data.map(d => d.name) },
          grid: { left: '3%', right: '4%', bottom: '8%', top: 40, containLabel: true },
          xAxis: { type: 'category', data: days },
          yAxis: { type: 'value', min: 0, max: 5 },
          series: data.map(d => ({
            name: d.name,
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            data: d.sessions,
            barWidth: 18,
          })),
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
  }, [children]);
  return <div ref={chartRef} className="w-full h-56" />;
};

const MyChildren: React.FC = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipIdx, setTipIdx] = useState(0);
  const [encIdx, setEncIdx] = useState(0);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const students = await studentService.getStudentsByParent(currentUser.uid);
        setChildren(students);
      } catch (err) {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [currentUser?.uid]);

  // Rotate parent tip every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setTipIdx(idx => (idx + 1) % parentTips.length), 10000);
    return () => clearInterval(interval);
  }, []);
  // Rotate encouragement every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => setEncIdx(idx => (idx + 1) % encouragements.length), 15000);
    return () => clearInterval(interval);
  }, []);

  // Mock progress and Phil-IRI for each child
  const childProgress = (id: string) => 60 + Math.round(Math.random() * 40);
  const childPhilIri = (id: string) => getRandomLevel();
  const childActivity = (name: string) => [
    `${name} completed a reading session (2 days ago)`,
    `${name} improved Phil-IRI level (last week)`
  ];
  const childStreak = () => 2 + Math.floor(Math.random() * 7); // 2-8 days
  const childLastActive = () => `${Math.floor(Math.random() * 5) + 1} days ago`;
  const childPhilIriProgress = () => Math.round(Math.random() * 100); // toward next level

  // Mini comparison bar if multiple children
  const ComparisonBar = () => (
    <div className="flex flex-row gap-4 mb-8">
      {children.map((child, i) => (
        <div key={child.id} className="flex flex-col items-center flex-1">
          <MiniProgressRing percent={childProgress(child.id || '')} />
          <span className="mt-1 text-xs font-semibold text-blue-700 truncate w-full text-center">{child.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-2">
      {/* Parent Tip */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">Parent Tip</span>
        <span className="text-sm text-gray-700 font-medium animate-fade-in">{parentTips[tipIdx]}</span>
      </div>
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">My Children</h3>
        <div className="text-gray-500 text-sm">View your children’s reading progress and achievements</div>
      </div>
      {/* Reading Leaderboard */}
      {children.length > 1 && <ReadingLeaderboard children={children} progress={childProgress} />}
      {/* Weekly Reading Activity Chart */}
      {children.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h4 className="text-lg font-semibold text-blue-700 mb-2">Weekly Reading Activity</h4>
          <WeeklyReadingActivityChart children={children} />
        </div>
      )}
      {/* Children List */}
      {loading ? (
        <div className="text-blue-400 text-center py-10">Loading children...</div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/child.svg" alt="No children" className="w-16 h-16 mb-2 opacity-60" />
          <p className="text-gray-500">No children linked to your account yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {children.map((child, i) => {
            const philIri = childPhilIri(child.id || '');
            return (
              <div
                key={child.id}
                className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 flex flex-col items-center w-full mx-0 transition-transform duration-200 hover:shadow-2xl hover:scale-[1.015]"
              >
                <div className="flex flex-row items-center w-full gap-8 flex-wrap md:flex-nowrap">
                  {/* Avatar + Name/Grade */}
                  <div className="flex flex-row items-center gap-4 min-w-[180px]">
                    <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-100 text-2xl font-extrabold text-blue-700 shadow-inner">
                  {child.name?.[0] || '?'}
                </div>
                    <div className="flex flex-col min-w-0">
                      <div className="font-bold text-blue-900 text-lg leading-tight truncate">{child.name}</div>
                      <div className="text-xs text-blue-500 font-medium truncate">{child.grade}</div>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="hidden md:block h-10 w-px bg-blue-100 mx-3" />
                  {/* Badges */}
                  <div className="flex flex-row gap-2">
                    {mockBadges.map((badge, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${badge.color}`}>{badge.label}</span>
                    ))}
                  </div>
                  {/* Divider */}
                  <div className="hidden md:block h-10 w-px bg-blue-100 mx-3" />
                  {/* Phil-IRI Level and Progress */}
                  <div className="flex flex-row items-center gap-2 min-w-[200px]">
                    <span className="text-blue-400 font-semibold text-xs">Phil-IRI Level:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${philIriColors[philIri]}`}>{philIri}</span>
                    <div className="flex-1 h-3 bg-blue-100 rounded-full ml-2 mr-2 min-w-[60px] max-w-[100px] overflow-hidden">
                      <div className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-300" style={{ width: `${childPhilIriProgress()}%` }} />
                    </div>
                    <span className="text-xs text-blue-600 font-bold">{childPhilIriProgress()}%</span>
                  </div>
                  {/* Divider */}
                  <div className="hidden md:block h-10 w-px bg-blue-100 mx-3" />
                  {/* Reading Streak and Last Active */}
                  <div className="flex flex-row items-center gap-2 min-w-[170px]">
                    <span className="text-xs text-green-600 font-bold">Reading Streak: {childStreak()} days</span>
                    <span className="text-xs text-gray-400 font-medium">Last active: {childLastActive()}</span>
                  </div>
                  {/* Divider */}
                  <div className="hidden md:block h-10 w-px bg-blue-100 mx-3" />
                  {/* Recent Activity */}
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-xs text-blue-700 font-bold mb-1">Recent Activity</span>
                    <ul className="text-xs text-gray-500 list-disc pl-4 space-y-0.5">
                      {childActivity(child.name).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Encouragement Card */}
      <div className="mt-10 flex justify-center">
        <div className="bg-blue-50 rounded-2xl shadow-md px-8 py-6 text-center max-w-xl">
          <span className="text-lg font-semibold text-blue-700">{encouragements[encIdx]}</span>
        </div>
      </div>
    </div>
  );
};

export default MyChildren; 
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface PerformanceChartProps {
  data: {
    weeks: string[];
    studentScores: number[];
    classAverages: number[];
  };
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
      
      const option = {
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut' as const,
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          textStyle: {
            color: '#374151'
          },
          formatter: function(params: any) {
            let result = `<div class="font-semibold text-gray-800 mb-2">${params[0].axisValue}</div>`;
            params.forEach((param: any) => {
              const color = param.color;
              const value = param.value;
              const name = param.seriesName;
              result += `
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}"></div>
                    <span class="text-gray-600">${name}</span>
                  </div>
                  <span class="font-semibold text-gray-800">${value}%</span>
                </div>
              `;
            });
            return result;
          }
        },
        legend: {
          data: ['Average Score', 'Class Average'],
          textStyle: {
            fontSize: 12,
            color: '#6b7280'
          },
          itemGap: 20,
          top: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data.weeks,
          axisLabel: {
            fontSize: 11,
            color: '#6b7280',
            rotate: 0
          },
          axisLine: {
            lineStyle: {
              color: '#e5e7eb'
            }
          },
          axisTick: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          max: 100,
          min: 0,
          axisLabel: {
            fontSize: 11,
            color: '#6b7280',
            formatter: '{value}%'
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#f3f4f6',
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: 'Average Score',
            type: 'line',
            data: data.studentScores,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: '#3b82f6'
            },
            itemStyle: {
              color: '#3b82f6',
              borderWidth: 2,
              borderColor: '#ffffff'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                  { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                ]
              }
            }
          },
          {
            name: 'Class Average',
            type: 'line',
            data: data.classAverages,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: '#10b981'
            },
            itemStyle: {
              color: '#10b981',
              borderWidth: 2,
              borderColor: '#ffffff'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                ]
              }
            }
          }
        ]
      };
      
      chartInstance.current.setOption(option);
      
      // Resize chart on window resize
      const resizeHandler = () => {
        chartInstance.current?.resize();
      };
      window.addEventListener('resize', resizeHandler);
      
      return () => {
        window.removeEventListener('resize', resizeHandler);
        chartInstance.current?.dispose();
      };
    }
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Student Performance</h3>
            <p className="text-sm text-gray-500">Track progress over the last 6 weeks</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <span>Last 6 Weeks</span>
              <i className="fas fa-chevron-down ml-2 text-xs"></i>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <i className="fas fa-download text-gray-600 hover:text-gray-800"></i>
            </button>
          </div>
        </div>
        <div ref={chartRef} className="w-full h-64 sm:h-72 lg:h-80"></div>
      </div>
    </div>
  );
};

export default PerformanceChart; 
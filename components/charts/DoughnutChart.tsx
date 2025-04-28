'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '@/contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  title: string;
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  height?: number;
  cutout?: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({
  title,
  labels,
  data,
  backgroundColor = [
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
  ],
  borderColor = [
    'rgba(54, 162, 235, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
  ],
  height = 300,
  cutout = '70%',
}) => {
  const { theme } = useTheme();
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#f8fafc' : '#171717',
        },
      },
      title: {
        display: true,
        text: title,
        color: theme === 'dark' ? '#f8fafc' : '#171717',
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8fafc' : '#171717',
        bodyColor: theme === 'dark' ? '#f8fafc' : '#171717',
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DoughnutChart;

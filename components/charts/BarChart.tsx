'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@/contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  title,
  labels,
  datasets,
  height = 300,
}) => {
  const { theme } = useTheme();
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? '#334155' : '#e5e7eb',
        },
        ticks: {
          color: theme === 'dark' ? '#f8fafc' : '#171717',
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#334155' : '#e5e7eb',
        },
        ticks: {
          color: theme === 'dark' ? '#f8fafc' : '#171717',
        },
      },
    },
  };

  const data = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      borderWidth: dataset.borderWidth || 1,
    })),
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar options={options} data={data} />
    </div>
  );
};

export default BarChart;

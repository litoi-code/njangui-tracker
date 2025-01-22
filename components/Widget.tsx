import React from 'react';
import { Paper, Typography } from '@mui/material';

interface WidgetProps {
  title: string;
  value: number;
}

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r},${g},${b})`;
};

const Widget: React.FC<WidgetProps> = ({ title, value }) => {
  return (
    <Paper className="rounded-lg shadow-md p-6 text-center">
      <Typography variant="h6" component="div" className="text-gray-800 font-semibold">
        {title}
      </Typography>
      <Typography variant="subtitle1" className="text-gray-600">
         Volume: {value}
      </Typography>
    </Paper>
  );
};

export default Widget;

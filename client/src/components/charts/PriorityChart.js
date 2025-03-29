// src/components/charts/PriorityChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
//                                                                                   ^^^^
// Add Cell to the imports from recharts

// Priority colors
const priorityColors = {
  'High': '#FF4560',
  'Medium': '#FEB019',
  'Low': '#00E396',
  'default': '#008FFB'
};

const PriorityChart = ({ data }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No priority data available</div>;
  }

  // Map data to include color
  const chartData = data.map(item => ({
    ...item,
    color: priorityColors[item.Priority] || priorityColors.default
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Priority" />
        <YAxis allowDecimals={false} />
        <Tooltip formatter={(value) => [value, 'Tickets']} />
        <Bar 
          dataKey="Count" 
          name="Tickets" 
          isAnimationActive={false}
          barSize={70}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PriorityChart;

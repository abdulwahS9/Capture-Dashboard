// src/components/charts/ResolutionTimeChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ResolutionTimeChart = ({ data }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No resolution time data available</div>;
  }

  // Process data to ensure AvgHours is a number and rounded
  const chartData = data.map(item => ({
    ...item,
    AvgHours: item.AvgHours !== null ? parseFloat(item.AvgHours).toFixed(1) : 0
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
        <XAxis dataKey="Category" />
        <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value) => [value, 'Hours']}
          labelFormatter={(value) => `Category: ${value}`}
        />
        <Bar 
          dataKey="AvgHours" 
          fill="#82ca9d" 
          name="Average Resolution Time"
          isAnimationActive={false}
          barSize={70}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ResolutionTimeChart;

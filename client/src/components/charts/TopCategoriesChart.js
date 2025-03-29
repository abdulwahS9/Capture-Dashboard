// src/components/charts/TopCategoriesChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TopCategoriesChart = ({ data }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No category data available</div>;
  }

  // Sort data by count
  const sortedData = [...data].sort((a, b) => b.Count - a.Count);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={sortedData}
        margin={{
          top: 5,
          right: 30,
          left: 120, // More space for category names
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis 
          type="category" 
          dataKey="Category" 
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(value) => [value, 'Tickets']} />
        <Bar 
          dataKey="Count" 
          fill="#8884d8" 
          name="Tickets"
          isAnimationActive={false}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopCategoriesChart;

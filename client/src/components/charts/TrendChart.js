// src/components/charts/TrendChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No trend data available</div>;
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Process data for the chart
  const chartData = data.map(item => ({
    ...item,
    FormattedDate: formatDate(item.Date)
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="FormattedDate" 
          tickMargin={10}
          interval="preserveStartEnd"
        />
        <YAxis allowDecimals={false} />
        <Tooltip 
          formatter={(value) => [value, 'Tickets']}
          labelFormatter={(value) => `Date: ${value}`}
        />
        <Line 
          type="monotone" 
          dataKey="Count" 
          stroke="#8884d8" 
          activeDot={{ r: 8 }} 
          name="Tickets Created"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;

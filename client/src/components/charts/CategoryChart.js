// src/components/charts/CategoryChart.js
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import useWindowSize from '../../hooks/useWindowSize';

// Pie chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

const CategoryChart = ({ data }) => {
  const { width } = useWindowSize();
  
  // Calculate chart width based on container size
  const chartWidth = Math.max(300, Math.min(width - 100, 500));
  
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No category data available</div>;
  }

  // Sort by count descending
  const sortedData = [...data].sort((a, b) => b.Count - a.Count);
  
  // If we have more than 8 categories, group the smaller ones as "Other"
  const processedData = sortedData.length > 8 
    ? [
        ...sortedData.slice(0, 7),
        {
          Category: 'Other',
          Count: sortedData.slice(7).reduce((sum, item) => sum + item.Count, 0)
        }
      ]
    : sortedData;

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Only show percentage if it's at least 5%
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const formatTooltipValue = (value, name, props) => {
    return [`${value} (${(props.percent * 100).toFixed(1)}%)`, 'Count'];
  };

  return (
    <div className="chart-wrapper" style={{ width: '100%', height: 300 }}>
      <PieChart width={chartWidth} height={300}>
        <Pie
          data={processedData}
          cx={chartWidth / 2}
          cy={150}
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="Count"
          nameKey="Category"
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatTooltipValue} />
        <Legend layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </div>
  );
};

export default CategoryChart;
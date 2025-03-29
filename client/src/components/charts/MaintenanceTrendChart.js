// src/components/charts/MaintenanceTrendChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import useWindowSize from '../../hooks/useWindowSize';

const MaintenanceTrendChart = ({ data }) => {
  const { width } = useWindowSize();
  
  // Calculate chart width based on container size
  const chartWidth = Math.max(300, Math.min(width - 100, 800));
  
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No trend data available</div>;
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  };

  // Process data for the chart - ensure we have data for every day in the range
  const processChartData = (rawData) => {
    // If no data, return empty array
    if (rawData.length === 0) return [];
    
    // Find date range
    let dates = rawData.map(item => new Date(item.Date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Create a map of dates to counts from raw data
    const dateCountMap = {};
    rawData.forEach(item => {
      const dateKey = new Date(item.Date).toISOString().split('T')[0];
      dateCountMap[dateKey] = item.Count;
    });
    
    // Create array with all dates in range
    const result = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({
        Date: new Date(currentDate),
        FormattedDate: formatDate(currentDate),
        Count: dateCountMap[dateKey] || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  };

  // Process data to fill in missing dates
  const chartData = processChartData(data);

  return (
    <div className="chart-wrapper" style={{ width: '100%', height: 300 }}>
      <LineChart
        width={chartWidth}
        height={300}
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
        <YAxis 
          allowDecimals={false} 
        />
        <Tooltip 
          formatter={(value) => [value, 'Records']}
          labelFormatter={(value) => `Date: ${value}`}
        />
        <Line 
          type="monotone" 
          dataKey="Count" 
          stroke="#8884d8" 
          activeDot={{ r: 8 }} 
          name="Maintenance Records"
          strokeWidth={2}
        />
      </LineChart>
    </div>
  );
};

export default MaintenanceTrendChart;
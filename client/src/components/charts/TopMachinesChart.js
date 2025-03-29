// src/components/charts/TopMachinesChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import useWindowSize from '../../hooks/useWindowSize';

const TopMachinesChart = ({ currentData, previousData, title }) => {
  const { width } = useWindowSize();
  
  // Calculate chart width based on container size
  const chartWidth = Math.max(300, Math.min(width - 100, 700));
  
  // Handle empty data
  if (!currentData || currentData.length === 0) {
    return <div className="no-data">No machine data available</div>;
  }

  // Process and combine data for comparison
  const processData = () => {
    // Create a map of equipment IDs to fault counts from previous month
    const previousDataMap = {};
    if (previousData && previousData.length > 0) {
      previousData.forEach(item => {
        previousDataMap[item.EquipmentID] = item.FaultCount;
      });
    }
    
    // Create the combined data with current month and previous month
    return currentData.map(item => {
      const previousCount = previousDataMap[item.EquipmentID] || 0;
      const percentChange = previousCount > 0 
        ? ((item.FaultCount - previousCount) / previousCount * 100).toFixed(1)
        : null;
        
      return {
        EquipmentID: item.EquipmentID,
        CurrentMonth: item.FaultCount,
        PreviousMonth: previousCount,
        PercentChange: percentChange
      };
    });
  };

  const data = processData();

  // Custom tooltip to show both current and previous data
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentData = payload.find(p => p.dataKey === 'CurrentMonth');
      const previousData = payload.find(p => p.dataKey === 'PreviousMonth');
      const item = data.find(d => d.EquipmentID === label);
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Machine: ${label}`}</p>
          <p style={{ color: currentData.color }}>{`Current Month: ${currentData.value} faults`}</p>
          {previousData && (
            <p style={{ color: previousData.color }}>{`Previous Month: ${previousData.value} faults`}</p>
          )}
          {item.PercentChange !== null && (
            <p style={{ color: item.PercentChange > 0 ? '#ff4d4f' : '#52c41a' }}>
              {`Change: ${item.PercentChange > 0 ? '+' : ''}${item.PercentChange}%`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-wrapper" style={{ width: '100%', height: 400 }}>
      <BarChart
        width={chartWidth}
        height={400}
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="EquipmentID" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar name="Current Month" dataKey="CurrentMonth" fill="#1890ff" />
        <Bar name="Previous Month" dataKey="PreviousMonth" fill="#bfbfbf" />
      </BarChart>
    </div>
  );
};

export default TopMachinesChart;
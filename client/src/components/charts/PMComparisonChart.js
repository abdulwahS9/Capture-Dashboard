// src/components/charts/PMComparisonChart.js
import React from 'react';
import useWindowSize from '../../hooks/useWindowSize';

const PMComparisonChart = ({ currentPM, previousPM }) => {
  const { width } = useWindowSize();
  
  // Handle invalid data
  if (currentPM === undefined || previousPM === undefined) {
    return <div className="no-data">No PM data available</div>;
  }

  // Calculate the percentage change
  const percentChange = previousPM > 0 
    ? ((currentPM - previousPM) / previousPM * 100).toFixed(1)
    : 0;
  
  // Determine if it's an increase or decrease
  const isIncrease = currentPM > previousPM;
  const isDecrease = currentPM < previousPM;
  const isNoChange = currentPM === previousPM;
  
  // Calculate the ratio for the bars
  const maxValue = Math.max(currentPM, previousPM);
  const currentWidth = maxValue > 0 ? (currentPM / maxValue * 100) : 0;
  const previousWidth = maxValue > 0 ? (previousPM / maxValue * 100) : 0;

  return (
    <div className="pm-comparison-chart">
      <div className="pm-header">
        <h3>Preventive Maintenance Comparison</h3>
      </div>
      
      <div className="pm-metrics">
        <div className="pm-metric">
          <div className="pm-label">This Month</div>
          <div className="pm-value">{currentPM}</div>
          <div className="pm-bar-container">
            <div 
              className="pm-bar current" 
              style={{ width: `${currentWidth}%` }}
            />
          </div>
        </div>
        
        <div className="pm-metric">
          <div className="pm-label">Last Month</div>
          <div className="pm-value">{previousPM}</div>
          <div className="pm-bar-container">
            <div 
              className="pm-bar previous" 
              style={{ width: `${previousWidth}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="pm-change">
        <div className={`pm-change-value ${isIncrease ? 'positive' : isDecrease ? 'negative' : 'neutral'}`}>
          {isIncrease ? '↑ ' : isDecrease ? '↓ ' : ''}{Math.abs(percentChange)}%
          {isIncrease ? ' increase' : isDecrease ? ' decrease' : ' no change'} from last month
        </div>
      </div>
      
      <style jsx>{`
        .pm-comparison-chart {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: 100%;
        }
        
        .pm-header {
          margin-bottom: 20px;
        }
        
        .pm-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }
        
        .pm-metrics {
          margin-bottom: 20px;
        }
        
        .pm-metric {
          margin-bottom: 15px;
        }
        
        .pm-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .pm-value {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .pm-bar-container {
          height: 12px;
          background-color: #f0f0f0;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .pm-bar {
          height: 100%;
          border-radius: 6px;
        }
        
        .pm-bar.current {
          background-color: #1890ff;
        }
        
        .pm-bar.previous {
          background-color: #bfbfbf;
        }
        
        .pm-change {
          text-align: center;
          padding-top: 10px;
        }
        
        .pm-change-value {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .pm-change-value.positive {
          color: #52c41a;
          background-color: #f6ffed;
        }
        
        .pm-change-value.negative {
          color: #ff4d4f;
          background-color: #fff2f0;
        }
        
        .pm-change-value.neutral {
          color: #666;
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
};

export default PMComparisonChart;
// src/components/KPICard.js
import React from 'react';
import '../styles/KPICard.css';

// Icons for KPI cards
const icons = {
  wrench: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  device: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <circle cx="12" cy="12" r="3"></circle>
      <line x1="12" y1="5" x2="12" y2="5.01"></line>
      <line x1="19" y1="12" x2="19.01" y2="12"></line>
      <line x1="12" y1="19" x2="12.01" y2="19"></line>
      <line x1="5" y1="12" x2="5.01" y2="12"></line>
    </svg>
  ),
  activity: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  alert: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
};

const KPICard = ({ title, value, icon, alertThreshold, trend }) => {
  // Determine if this KPI should show an alert state
  let isAlert = false;
  
  if (alertThreshold !== undefined) {
    if (typeof value === 'string') {
      // Extract number from string if needed (e.g. "10.5 hrs")
      const numValue = parseFloat(value);
      isAlert = !isNaN(numValue) && numValue >= alertThreshold;
    } else {
      isAlert = value >= alertThreshold;
    }
  }
  
  // Format number values for better display
  const formattedValue = typeof value === 'number' && value > 999 
    ? value.toLocaleString() 
    : value;
  
  return (
    <div className={`kpi-card ${isAlert ? 'alert' : ''}`}>
      <div className="kpi-icon">
        {icons[icon] || icons.activity}
      </div>
      <div className="kpi-content">
        <div className="kpi-value">
          {formattedValue}
          {trend && (
            <span className={`trend-indicator ${trend > 0 ? 'up' : trend < 0 ? 'down' : ''}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
            </span>
          )}
        </div>
        <div className="kpi-title">{title}</div>
      </div>
    </div>
  );
};

export default KPICard;
// src/components/Dashboard.js - Enhanced with advanced analytics
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import '../styles/Dashboard.css';
import '../styles/Charts.css';

// Import custom hooks
import useWindowSize from '../hooks/useWindowSize';

// React components
const MaintenanceTrendChart = React.lazy(() => import('./charts/MaintenanceTrendChart'));
const CategoryChart = React.lazy(() => import('./charts/CategoryChart'));
const DeviceListTable = React.lazy(() => import('./tables/DeviceListTable'));
const RecentMaintenanceTable = React.lazy(() => import('./tables/RecentMaintenanceTable'));
const KPICard = React.lazy(() => import('./KPICard'));
const TopMachinesChart = React.lazy(() => import('./charts/TopMachinesChart'));
const PMComparisonChart = React.lazy(() => import('./charts/PMComparisonChart'));

// Socket.IO server URL
const SOCKET_SERVER_URL = 'http://10.1.1.20:5000';

function Dashboard() {
  const { width } = useWindowSize();
  const [socket, setSocket] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    maintenanceTrend: [],
    maintenanceByCategory: [],
    statusDistribution: [],
    priorityDistribution: [],
    recentMaintenance: [],
    eventTrend: [],
    recentEvents: [],
    deviceList: [],
    analytics: {
      topMachinesThisMonth: [],
      topMachinesLastMonth: [],
      pmThisMonth: 0,
      pmLastMonth: 0,
      faultsByLocation: [],
      recurringFaults: [],
      dailyFaultTrend: [],
      resolutionByCategory: [],
      mtbfTopMachines: []
    },
    kpis: {
      maintenanceCount: 0,
      eventCount: 0,
      deviceCount: 0,
      pmThisMonth: 0,
      pmLastMonth: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'analytics'

  useEffect(() => {
    // Try direct API call first for faster initial load
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${SOCKET_SERVER_URL}/api/dashboard-data`);
        const data = await response.json();
        console.log('Initial data from API:', data);
        
        if (data.error) {
          setError(data.error);
        } else {
          setDashboardData(data);
          setLastUpdated(new Date());
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data. Trying socket connection...');
      }
    };
    
    fetchInitialData();
    
    // Create socket connection
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('error');
      setError(`Connection error: ${err.message}`);
    });

    newSocket.on('dashboard-update', (data) => {
      console.log('Received dashboard update:', data);
      
      if (data.error) {
        setError(data.error);
      } else {
        setDashboardData(data);
        setLastUpdated(new Date());
        setError(null); // Clear any previous errors
      }
      
      setLoading(false);
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Format the last updated time
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };

  // Switch between tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner"></div>
        <h2>Loading dashboard data...</h2>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Capture Maintenance Dashboard</h1>
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            Advanced Analytics
          </button>
        </div>
        <div className="header-right">
          <div className="connection-status">
            <span className={`status-indicator ${connectionStatus}`}></span>
            {connectionStatus === 'connected' ? 'Live Data' : connectionStatus}
          </div>
          <div className="last-updated">
            Last updated: {formatLastUpdated()}
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {activeTab === 'overview' ? (
        // Overview Tab
        <>
          <React.Suspense fallback={<div>Loading KPIs...</div>}>
            <div className="kpi-container">
              <KPICard 
                title="Total Maintenance Records" 
                value={dashboardData.kpis.maintenanceCount || 0} 
                icon="wrench"
              />
              <KPICard 
                title="Total Devices" 
                value={dashboardData.kpis.deviceCount || 0} 
                icon="device"
              />
              <KPICard 
                title="PM This Month" 
                value={dashboardData.kpis.pmThisMonth || 0} 
                icon="calendar"
                trend={dashboardData.kpis.pmLastMonth ? (((dashboardData.kpis.pmThisMonth - dashboardData.kpis.pmLastMonth) / dashboardData.kpis.pmLastMonth) * 100) : 0}
              />
              <KPICard 
                title="Recent Activity" 
                value={dashboardData.recentMaintenance.length || 0} 
                icon="activity"
              />
            </div>
          </React.Suspense>

          <div className="charts-container">
            {dashboardData.maintenanceTrend.length > 0 && (
              <div className="chart-row">
                <div className="chart-container large">
                  <h3>Maintenance Activity (Last 30 Days)</h3>
                  <React.Suspense fallback={<div>Loading chart...</div>}>
                    <MaintenanceTrendChart data={dashboardData.maintenanceTrend} />
                  </React.Suspense>
                </div>
              </div>
            )}
            
            <div className="chart-row">
              {dashboardData.maintenanceByCategory.length > 0 && (
                <div className="chart-container">
                  <h3>Maintenance by Category</h3>
                  <React.Suspense fallback={<div>Loading chart...</div>}>
                    <CategoryChart data={dashboardData.maintenanceByCategory} />
                  </React.Suspense>
                </div>
              )}
              
              {dashboardData.statusDistribution.length > 0 && (
                <div className="chart-container">
                  <h3>Maintenance Status</h3>
                  <React.Suspense fallback={<div>Loading chart...</div>}>
                    <CategoryChart data={dashboardData.statusDistribution.map(item => ({
                      Category: item.Status,
                      Count: item.Count
                    }))} />
                  </React.Suspense>
                </div>
              )}
            </div>
            
            {dashboardData.recentMaintenance.length > 0 && (
              <div className="chart-row">
                <div className="chart-container full-width">
                  <h3>Recent Maintenance Records</h3>
                  <React.Suspense fallback={<div>Loading maintenance records...</div>}>
                    <RecentMaintenanceTable data={dashboardData.recentMaintenance} />
                  </React.Suspense>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // Advanced Analytics Tab
        <>
          <div className="analytics-section">
            <h2>Machine Performance Analysis</h2>
            
            <div className="chart-row">
              {dashboardData.analytics.topMachinesThisMonth && dashboardData.analytics.topMachinesThisMonth.length > 0 && (
                <div className="chart-container large">
                  <h3>Top 10 Machines with Faults (This Month vs Last Month)</h3>
                  <React.Suspense fallback={<div>Loading chart...</div>}>
                    <TopMachinesChart 
                      currentData={dashboardData.analytics.topMachinesThisMonth}
                      previousData={dashboardData.analytics.topMachinesLastMonth}
                    />
                  </React.Suspense>
                </div>
              )}
            </div>
            
            <div className="chart-row">
              {dashboardData.analytics.mtbfTopMachines && dashboardData.analytics.mtbfTopMachines.length > 0 && (
                <div className="chart-container">
                  <h3>Mean Time Between Failures (MTBF)</h3>
                  <React.Suspense fallback={<div>Loading chart...</div>}>
                    <div className="data-table-container">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Equipment ID</th>
                            <th>Fault Count</th>
                            <th>Avg Hours Between Failures</th>
                            <th>Avg Days Between Failures</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.analytics.mtbfTopMachines.map((item, index) => (
                            <tr key={index}>
                              <td>{item.EquipmentID}</td>
                              <td>{item.FaultCount}</td>
                              <td>{item.AvgHoursBetweenFailures ? item.AvgHoursBetweenFailures.toFixed(1) : 'N/A'}</td>
                              <td>{item.AvgHoursBetweenFailures ? (item.AvgHoursBetweenFailures / 24).toFixed(1) : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </React.Suspense>
                </div>
              )}
              
              <div className="chart-container">
                <h3>Preventive Maintenance Comparison</h3>
                <React.Suspense fallback={<div>Loading chart...</div>}>
                  <PMComparisonChart 
                    currentPM={dashboardData.analytics.pmThisMonth} 
                    previousPM={dashboardData.analytics.pmLastMonth}
                  />
                </React.Suspense>
              </div>
            </div>
            
            {dashboardData.analytics.recurringFaults && dashboardData.analytics.recurringFaults.length > 0 && (
              <div className="chart-row">
                <div className="chart-container full-width">
                  <h3>Recurring Faults Analysis (Same Machine & Category within 7 Days)</h3>
                  <React.Suspense fallback={<div>Loading data...</div>}>
                    <div className="data-table-container">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Equipment ID</th>
                            <th>Fault Category</th>
                            <th>Recurrence Count</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.analytics.recurringFaults.map((item, index) => (
                            <tr key={index} className={item.RecurrenceCount > 2 ? 'high-priority' : ''}>
                              <td>{item.EquipmentID}</td>
                              <td>{item.Category}</td>
                              <td>{item.RecurrenceCount}</td>
                              <td>
                                <button className="action-button">
                                  {item.RecurrenceCount > 2 ? 'Investigate' : 'View History'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </React.Suspense>
                </div>
              </div>
            )}
          </div>
          
          {dashboardData.analytics.faultsByLocation && dashboardData.analytics.faultsByLocation.length > 0 && (
            <div className="analytics-section">
              <h2>Location Analysis</h2>
              <div className="chart-row">
                <div className="chart-container full-width">
                  <h3>Fault Count by Location (Last 3 Months)</h3>
                  <div className="location-grid">
                    {dashboardData.analytics.faultsByLocation.map((item, index) => (
                      <div 
                        key={index} 
                        className="location-card"
                        style={{
                          opacity: 0.5 + (0.5 * item.FaultCount / Math.max(...dashboardData.analytics.faultsByLocation.map(i => i.FaultCount)))
                        }}
                      >
                        <div className="location-name">{item.Location || 'Unknown'}</div>
                        <div className="location-value">{item.FaultCount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {dashboardData.analytics.resolutionByCategory && dashboardData.analytics.resolutionByCategory.length > 0 && (
            <div className="analytics-section">
              <h2>Maintenance Efficiency</h2>
              <div className="chart-row">
                <div className="chart-container full-width">
                  <h3>Resolution Time by Category (Avg Hours)</h3>
                  <div className="data-table-container">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Avg Resolution Time (Hours)</th>
                          <th>Min Time</th>
                          <th>Max Time</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.analytics.resolutionByCategory.map((item, index) => (
                          <tr key={index}>
                            <td>{item.Category}</td>
                            <td>{item.AvgHours ? item.AvgHours.toFixed(1) : 'N/A'}</td>
                            <td>{item.MinHours || 'N/A'}</td>
                            <td>{item.MaxHours || 'N/A'}</td>
                            <td>
                              <div className="performance-indicator-container">
                                <div 
                                  className={`performance-indicator ${
                                    item.AvgHours < 24 ? 'good' : 
                                    item.AvgHours < 48 ? 'average' : 
                                    'poor'
                                  }`}
                                >
                                  {item.AvgHours < 24 ? 'Good' : 
                                   item.AvgHours < 48 ? 'Average' : 
                                   'Needs Improvement'}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <footer className="dashboard-footer">
        <p>Capture Maintenance System Dashboard</p>
      </footer>
    </div>
  );
}

export default Dashboard;
// src/components/tables/RecentMaintenanceTable.js
import React, { useState } from 'react';
import '../../styles/Tables.css';

const RecentMaintenanceTable = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No maintenance records available</div>;
  }

  // Get column names from the first row
  const columns = Object.keys(data[0]);
  
  // Filter out columns we don't want to display in the main table
  const excludedColumns = ['rowguid', 'timestamp', 'id'];
  
  // Prioritize important columns first
  const priorityColumns = [
    'date', 'time', 'created', 'validated', 'type', 'category', 'operation', 
    'status', 'description', 'terminal', 'device', 'technician'
  ];
  
  // Find which priority columns exist in our data
  const availablePriorityColumns = priorityColumns.filter(col => 
    columns.some(dataCol => dataCol.toLowerCase().includes(col.toLowerCase()))
  );
  
  // If we found priority columns, use them; otherwise use all non-excluded columns
  const displayColumns = availablePriorityColumns.length > 0
    ? availablePriorityColumns.slice(0, 5) // Limit to first 5 priority columns
    : columns
        .filter(column => !excludedColumns.some(excluded => 
          column.toLowerCase().includes(excluded.toLowerCase()))
        )
        .slice(0, 5); // Limit to first 5 non-excluded columns
  
  // Toggle row expansion
  const toggleRowExpansion = (index) => {
    if (expandedRow === index) {
      setExpandedRow(null);
    } else {
      setExpandedRow(index);
    }
  };
  
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {displayColumns.map((column, index) => (
              <th key={index}>{formatColumnName(column)}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <tr onClick={() => toggleRowExpansion(rowIndex)}>
                {displayColumns.map((column, colIndex) => (
                  <td key={colIndex}>{formatCellValue(row[column])}</td>
                ))}
                <td>
                  <button className="details-button">
                    {expandedRow === rowIndex ? 'Hide Details' : 'Show Details'}
                  </button>
                </td>
              </tr>
              {expandedRow === rowIndex && (
                <tr className="expanded-row">
                  <td colSpan={displayColumns.length + 1}>
                    <div className="expanded-content">
                      <h4>Record Details</h4>
                      <div className="details-grid">
                        {columns.map((column, index) => (
                          <div key={index} className="detail-item">
                            <span className="detail-label">{formatColumnName(column)}:</span>
                            <span className="detail-value">{formatCellValue(row[column])}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to format column names for display
const formatColumnName = (columnName) => {
  // Convert camelCase or snake_case to Title Case With Spaces
  return columnName
    // Insert a space before uppercase letters
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, char => char.toUpperCase())
    // Trim any leading spaces
    .trim();
};

// Helper function to format cell values for display
const formatCellValue = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Format date values
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      // If date parsing fails, just return the value as is
      return value;
    }
  }
  
  // Format boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Truncate long strings
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 47) + '...';
  }
  
  return value;
};

export default RecentMaintenanceTable;
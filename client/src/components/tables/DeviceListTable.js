// src/components/tables/DeviceListTable.js
import React from 'react';
import '../../styles/Tables.css';

const DeviceListTable = ({ data }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="no-data">No device data available</div>;
  }

  // Get column names from the first row
  const columns = Object.keys(data[0]);
  
  // Filter out columns we don't want to display (too technical or irrelevant)
  const excludedColumns = ['id', 'rowguid', 'timestamp', 'modified', 'created'];
  const displayColumns = columns
    .filter(column => !excludedColumns.some(excluded => 
      column.toLowerCase().includes(excluded.toLowerCase())
    ))
    .slice(0, 5); // Limit to first 5 relevant columns to prevent overcrowding

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {displayColumns.map((column, index) => (
              <th key={index}>{formatColumnName(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {displayColumns.map((column, colIndex) => (
                <td key={colIndex}>{formatCellValue(row[column])}</td>
              ))}
            </tr>
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
      return date.toLocaleDateString();
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

export default DeviceListTable;
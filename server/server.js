// server.js - Improved with better table selection logic for Capture system
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
app.use(express.static(path.join(__dirname, '../client/build')));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// SQL Server configuration
const sqlConfig = {
  user: 'admin',           
  password: 'P@ssw0rd',       
  server: 'localhost',             
  database: 'TransportationDubai',       
  options: {
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Create connection pool
const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

// Schema cache to avoid repeated exploration
let discoveredSchema = null;
let tableInfo = {};

// Function to explore database schema and gather more detailed information
async function exploreDatabase() {
  if (discoveredSchema) return discoveredSchema;
  
  console.log("Exploring database schema...");
  await poolConnect;
  
  try {
    // Get all tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    const tables = [];
    tableInfo = {};
    
    console.log(`Found ${tablesResult.recordset.length} tables in database`);
    
    // For each table, get detailed information
    for (const table of tablesResult.recordset) {
      const tableName = table.TABLE_NAME;
      console.log(`Exploring table: ${tableName}`);
      
      // Get column information
      const columnsResult = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);
      
      const columns = columnsResult.recordset;
      
      // Store column names for easier access
      const columnNames = columns.map(col => col.COLUMN_NAME.toLowerCase());
      
      // Get sample data to understand the table content
      let sampleData = [];
      try {
        const sampleResult = await pool.request().query(`
          SELECT TOP 5 * FROM [${tableName}]
        `);
        sampleData = sampleResult.recordset;
      } catch (err) {
        console.error(`Error getting sample data for ${tableName}:`, err.message);
      }
      
      // Get count to understand table size
      let recordCount = 0;
      try {
        const countResult = await pool.request().query(`
          SELECT COUNT(*) as Count FROM [${tableName}]
        `);
        recordCount = countResult.recordset[0].Count;
      } catch (err) {
        console.error(`Error getting count for ${tableName}:`, err.message);
      }
      
      // Save detailed table information
      tableInfo[tableName] = {
        name: tableName,
        columns: columns,
        columnNames: columnNames,
        recordCount: recordCount,
        sampleData: sampleData
      };
      
      tables.push({
        name: tableName,
        columns: columns,
        recordCount: recordCount
      });
    }
    
    discoveredSchema = {
      tables: tables
    };
    
    // Now analyze the tables to find maintenance-related data
    analyzeTables();
    
    return discoveredSchema;
  } catch (err) {
    console.error('Error exploring database:', err);
    throw err;
  }
}

// Function to determine which tables to use for the dashboard
function analyzeTables() {
  console.log("Analyzing tables to determine dashboard data sources...");
  
  // These are the tables we'll use for different dashboard components
  discoveredSchema.maintenanceTable = findMaintenanceTable();
  discoveredSchema.eventTable = findEventTable();
  discoveredSchema.deviceTable = findDeviceTable();
  discoveredSchema.technicianTable = findTechnicianTable();
  
  console.log("Analysis complete. Using the following tables:");
  console.log("- Maintenance data:", discoveredSchema.maintenanceTable || "None found");
  console.log("- Event data:", discoveredSchema.eventTable || "None found");
  console.log("- Device data:", discoveredSchema.deviceTable || "None found");
  console.log("- Technician data:", discoveredSchema.technicianTable || "None found");
}

// Function to find the main maintenance/tickets table
function findMaintenanceTable() {
  // First check if we have a "Faults" table specifically, as this is the main tickets table in Capture system
  if (tableInfo["Faults"]) {
    console.log("Found Faults table - using as main tickets table");
    return "Faults";
  }
  
  // Also check for FaultsBus or other variants
  const faultsVariants = ["FaultsBus", "FaultsBNA", "FaultsEVD", "FaultsTUM", "FaultsOtherDevices"];
  for (const variant of faultsVariants) {
    if (tableInfo[variant]) {
      console.log(`Found ${variant} table - using as main tickets table`);
      return variant;
    }
  }
  
  // Otherwise, look for tables related to faults, maintenance, or operations
  const candidates = Object.keys(tableInfo).filter(tableName => {
    const name = tableName.toLowerCase();
    return name.includes('fault') || 
           name.includes('maintenance') || 
           name.includes('operation') || 
           name.includes('ticket') ||
           name.includes('record');
  });
  
  if (candidates.length === 0) {
    console.log("No maintenance tables found");
    return null;
  }
  
  // Score based on record count and column relevance
  let bestTable = null;
  let bestScore = 0;
  
  for (const tableName of candidates) {
    const table = tableInfo[tableName];
    let score = 0;
    
    // Tables with more records are more likely to be the main table
    score += Math.min(table.recordCount / 100, 10); // Cap at 10 points
    
    // Check for relevant columns
    const columnNames = table.columnNames;
    if (columnNames.some(name => name.includes('type'))) score += 2;
    if (columnNames.some(name => name.includes('date'))) score += 2;
    if (columnNames.some(name => name.includes('id'))) score += 1;
    if (columnNames.some(name => name.includes('description'))) score += 2;
    if (columnNames.some(name => name.includes('category'))) score += 3;
    
    console.log(`Maintenance table candidate: ${tableName}, Score: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestTable = tableName;
    }
  }
  
  return bestTable;
}

// Function to find event-related table
function findEventTable() {
  // First check for "Event" table specifically
  if (tableInfo["Event"]) {
    console.log("Found Event table");
    return "Event";
  }
  
  // Look for tables related to events or actions
  const candidates = Object.keys(tableInfo).filter(tableName => {
    const name = tableName.toLowerCase();
    return name.includes('event') || 
           name.includes('action') || 
           name.includes('activity') ||
           name.includes('log');
  });
  
  if (candidates.length === 0) return null;
  
  // Use the table with the most records
  let bestTable = null;
  let maxCount = 0;
  
  for (const tableName of candidates) {
    const count = tableInfo[tableName].recordCount;
    if (count > maxCount) {
      maxCount = count;
      bestTable = tableName;
    }
  }
  
  return bestTable;
}

// Function to find device or equipment table
function findDeviceTable() {
  // Check for specific Capture system device tables
  const deviceTables = ["Terminal", "TechnicalUnit", "BusDetails", "DeviceAssignment"];
  for (const tableName of deviceTables) {
    if (tableInfo[tableName]) {
      console.log(`Found ${tableName} table - using as device table`);
      return tableName;
    }
  }
  
  // Look for tables related to devices or technical units
  const candidates = Object.keys(tableInfo).filter(tableName => {
    const name = tableName.toLowerCase();
    return name.includes('device') || 
           name.includes('equipment') || 
           name.includes('asset') ||
           name.includes('unit') ||
           name.includes('terminal') ||
           name.includes('component') ||
           name.includes('bus') ||
           name.includes('tvm');
  });
  
  if (candidates.length === 0) return null;
  
  // Prefer tables with device or equipment in the name
  for (const tableName of candidates) {
    if (tableName.toLowerCase().includes('device') || 
        tableName.toLowerCase().includes('equipment')) {
      return tableName;
    }
  }
  
  // Otherwise use the first one
  return candidates[0];
}

// Function to find technician or user table
function findTechnicianTable() {
  // Check for Technicians table specifically
  if (tableInfo["Technicians"]) {
    console.log("Found Technicians table");
    return "Technicians";
  }
  
  // Also check for CaptureAgent
  if (tableInfo["CaptureAgent"]) {
    console.log("Found CaptureAgent table");
    return "CaptureAgent";
  }
  
  // Look for tables related to technicians or users
  const candidates = Object.keys(tableInfo).filter(tableName => {
    const name = tableName.toLowerCase();
    return name.includes('technician') || 
           name.includes('engineer') || 
           name.includes('staff') ||
           name.includes('user') ||
           name.includes('employee') ||
           name.includes('personnel') ||
           name.includes('agent');
  });
  
  if (candidates.length === 0) return null;
  
  // Prefer tables with technician in the name
  for (const tableName of candidates) {
    if (tableName.toLowerCase().includes('technician')) {
      return tableName;
    }
  }
  
  // Otherwise use the first one
  return candidates[0];
}

// Function to build dynamic queries based on discovered schema
function buildQueries() {
  const queries = {};
  
  // Only build queries for tables we found
  if (discoveredSchema.maintenanceTable) {
    const tableName = discoveredSchema.maintenanceTable;
    const table = tableInfo[tableName];
    const columns = table.columnNames;
    
    // Identify common fields based on Capture system schema
    let dateColumn, categoryColumn, statusColumn, priorityColumn, descriptionColumn;
    
    // Specific mappings for known tables
    if (tableName === "Faults") {
      dateColumn = "Validated";
      categoryColumn = "CategoryClassifier";
      statusColumn = "Status";
      priorityColumn = "Priority";
      descriptionColumn = "FullDescription";
    } else {
      // Try to find appropriate columns if not a known table
      dateColumn = columns.find(name => name.includes('date')) || 
                  columns.find(name => name.includes('validated')) ||
                  columns.find(name => name.includes('created')) ||
                  columns.find(name => name.includes('time'));
      
      categoryColumn = columns.find(name => name.includes('category')) || 
                      columns.find(name => name.includes('classifier')) ||
                      columns.find(name => name.includes('type')) ||
                      columns.find(name => name.includes('class'));
      
      statusColumn = columns.find(name => name.includes('status'));
      priorityColumn = columns.find(name => name.includes('priority'));
      descriptionColumn = columns.find(name => name.includes('description'));
    }
    
    console.log(`Using columns for ${tableName}:`);
    console.log(`- Date: ${dateColumn}`);
    console.log(`- Category: ${categoryColumn}`);
    console.log(`- Status: ${statusColumn}`);
    console.log(`- Priority: ${priorityColumn}`);
    console.log(`- Description: ${descriptionColumn}`);
    
    // Build maintenance data trend query (last 30 days)
    if (dateColumn) {
      queries.maintenanceTrend = `
        SELECT CAST(${dateColumn} as DATE) as Date, COUNT(*) as Count
        FROM ${tableName}
        WHERE ${dateColumn} >= DATEADD(day, -30, GETDATE())
        GROUP BY CAST(${dateColumn} as DATE)
        ORDER BY CAST(${dateColumn} as DATE)
      `;
    }
    
    // Build maintenance by category query
    if (categoryColumn) {
      queries.maintenanceByCategory = `
        SELECT ${categoryColumn} as Category, COUNT(*) as Count
        FROM ${tableName}
        WHERE ${categoryColumn} IS NOT NULL
        GROUP BY ${categoryColumn}
        ORDER BY Count DESC
      `;
    }
    
    // Build status distribution query
    if (statusColumn) {
      queries.statusDistribution = `
        SELECT ${statusColumn} as Status, COUNT(*) as Count
        FROM ${tableName}
        WHERE ${statusColumn} IS NOT NULL
        GROUP BY ${statusColumn}
        ORDER BY Count DESC
      `;
    }
    
    // Build priority distribution query
    if (priorityColumn) {
      queries.priorityDistribution = `
        SELECT ${priorityColumn} as Priority, COUNT(*) as Count
        FROM ${tableName}
        WHERE ${priorityColumn} IS NOT NULL
        GROUP BY ${priorityColumn}
        ORDER BY Count DESC
      `;
    }
    
    // Get total maintenance count
    queries.maintenanceCount = `
      SELECT COUNT(*) as Count FROM ${tableName}
    `;
    
    // Get recent maintenance records
    const orderByColumn = dateColumn || 'ID';
    queries.recentMaintenance = `
      SELECT TOP 10 * FROM ${tableName}
      ORDER BY ${orderByColumn} DESC
    `;
  }
  
  // Build event queries if we found an event table
  if (discoveredSchema.eventTable) {
    const tableName = discoveredSchema.eventTable;
    const columns = tableInfo[tableName].columnNames;
    
    // Try to find date column
    const dateColumn = columns.find(name => name.includes('date')) || 
                      columns.find(name => name.includes('time')) ||
                      'date'; // fallback
    
    // Event trend
    queries.eventTrend = `
      SELECT CAST(${dateColumn} as DATE) as Date, COUNT(*) as Count
      FROM ${tableName}
      WHERE ${dateColumn} >= DATEADD(day, -30, GETDATE())
      GROUP BY CAST(${dateColumn} as DATE)
      ORDER BY CAST(${dateColumn} as DATE)
    `;
    
    // Recent events
    queries.recentEvents = `
      SELECT TOP 10 * FROM ${tableName}
      ORDER BY ${dateColumn} DESC
    `;
  }
  
  // Build device queries if we found a device table
  if (discoveredSchema.deviceTable) {
    const tableName = discoveredSchema.deviceTable;
    
    // Device count
    queries.deviceCount = `
      SELECT COUNT(*) as Count FROM ${tableName}
    `;
    
    // Device list
    queries.deviceList = `
      SELECT TOP 20 * FROM ${tableName}
    `;
  }
  
  return queries;
}

// API endpoint to get database schema information and discovery results
app.get('/api/schema-info', async (req, res) => {
  try {
    // Perform database exploration if not already done
    if (!discoveredSchema) {
      await exploreDatabase();
    }
    
    // Return high-level schema information (not all the sample data to keep response size reasonable)
    const response = {
      tables: discoveredSchema.tables.map(table => ({
        name: table.name,
        columnCount: table.columns.length,
        recordCount: table.recordCount
      })),
      maintenanceTable: discoveredSchema.maintenanceTable,
      eventTable: discoveredSchema.eventTable,
      deviceTable: discoveredSchema.deviceTable,
      technicianTable: discoveredSchema.technicianTable
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error in schema API:', err);
    res.status(500).json({ 
      error: 'Failed to explore database schema',
      message: err.message
    });
  }
});

// API endpoint to get information about a specific table
app.get('/api/table-info/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Make sure we've explored the database
    if (!discoveredSchema) {
      await exploreDatabase();
    }
    
    // Check if the table exists
    if (!tableInfo[tableName]) {
      return res.status(404).json({
        error: 'Table not found',
        message: `The table "${tableName}" was not found in the database`
      });
    }
    
    // Return table information
    const table = tableInfo[tableName];
    res.json({
      name: table.name,
      columns: table.columns,
      recordCount: table.recordCount,
      sampleData: table.sampleData.slice(0, 2) // Only send a couple of rows to limit response size
    });
  } catch (err) {
    console.error('Error in table info API:', err);
    res.status(500).json({
      error: 'Failed to get table information',
      message: err.message
    });
  }
});

// API endpoint to run a test query on a specific table
app.get('/api/test-query/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Make sure we've explored the database
    if (!discoveredSchema) {
      await exploreDatabase();
    }
    
    // Check if the table exists
    if (!tableInfo[tableName]) {
      return res.status(404).json({
        error: 'Table not found',
        message: `The table "${tableName}" was not found in the database`
      });
    }
    
    // Run a simple count query
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as RecordCount FROM [${tableName}]
    `);
    
    const recordCount = countResult.recordset[0].RecordCount;
    
    // Get a sample of records
    const sampleResult = await pool.request().query(`
      SELECT TOP 5 * FROM [${tableName}]
    `);
    
    res.json({
      tableName,
      recordCount,
      sample: sampleResult.recordset,
      message: `Found ${recordCount} records in ${tableName}`
    });
  } catch (err) {
    console.error('Error in test query API:', err);
    res.status(500).json({
      error: 'Failed to run test query',
      message: err.message
    });
  }
});


// Modify the fetchDashboardData function to include advanced analytics
// Add this to your existing fetchDashboardData function
async function fetchDashboardData() {
  try {
    // First explore database if we haven't already
    if (!discoveredSchema) {
      await exploreDatabase();
    }
    
    // If we couldn't find any suitable maintenance table
    if (!discoveredSchema.maintenanceTable) {
      console.error("No suitable maintenance table found in database");
      return {
        error: "No suitable maintenance table found",
        maintenanceTrend: [],
        maintenanceByCategory: [],
        statusDistribution: [],
        priorityDistribution: [],
        recentMaintenance: [],
        analytics: {}, // Empty analytics
        kpis: {
          maintenanceCount: 0,
          eventCount: 0,
          deviceCount: 0,
          pmThisMonth: 0,
          pmLastMonth: 0
        }
      };
    }
    
    // Build queries based on discovered schema
    const queries = buildQueries();
    
    // Initialize data structure
    const dashboardData = {
      maintenanceTrend: [],
      maintenanceByCategory: [],
      statusDistribution: [],
      priorityDistribution: [],
      recentMaintenance: [],
      eventTrend: [],
      recentEvents: [],
      deviceList: [],
      kpis: {
        maintenanceCount: 0,
        eventCount: 0,
        deviceCount: 0,
        pmThisMonth: 0,
        pmLastMonth: 0
      }
    };
    
    // Execute all basic queries as before
    // (Keep your existing query execution code here)
    
    // Add advanced analytics
    console.log("Fetching advanced analytics...");
    try {
      const analyticsData = await fetchAdvancedAnalytics();
      
      // Add analytics data to the dashboard data
      dashboardData.analytics = analyticsData;
      
      // Add PM counts to KPIs
      dashboardData.kpis.pmThisMonth = analyticsData.pmThisMonth;
      dashboardData.kpis.pmLastMonth = analyticsData.pmLastMonth;
      
      console.log("Advanced analytics completed");
    } catch (err) {
      console.error("Error fetching advanced analytics:", err.message);
      dashboardData.analytics = {}; // Empty object on error
    }
    
    return dashboardData;
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return {
      error: err.message,
      maintenanceTrend: [],
      maintenanceByCategory: [],
      statusDistribution: [],
      priorityDistribution: [],
      recentMaintenance: [],
      analytics: {}, // Empty analytics
      kpis: {
        maintenanceCount: 0,
        eventCount: 0,
        deviceCount: 0,
        pmThisMonth: 0,
        pmLastMonth: 0
      }
    };
  }
}

// API endpoint to get dashboard data
app.get('/api/dashboard-data', async (req, res) => {
  try {
    const data = await fetchDashboardData();
    res.json(data);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial data
  sendDashboardData(socket);
  
  // Set up polling interval (10 seconds)
  const intervalId = setInterval(() => {
    sendDashboardData(socket);
  }, 10000);
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    clearInterval(intervalId);
    console.log('Client disconnected');
  });
});



// Function to build more advanced analytics queries for maintenance data
function buildAdvancedAnalytics() {
  const analytics = {};
  
  if (!discoveredSchema.maintenanceTable) {
    return analytics;
  }
  
  const tableName = discoveredSchema.maintenanceTable;
  const table = tableInfo[tableName];
  const columns = table.columnNames;
  
  // Identify important fields based on Capture system schema
  let dateColumn, categoryColumn, statusColumn, equipmentColumn, locationColumn, typeColumn;
  
  // Specific mappings for Faults table
  if (tableName === "Faults") {
    dateColumn = "Validated";
    categoryColumn = "CategoryClassifier";
    statusColumn = "Status";
    equipmentColumn = "TerminalID"; // Machine/equipment identifier
    locationColumn = "Location";
    typeColumn = "Type"; // For identifying PM vs corrective maintenance
  } else {
    // Try to find appropriate columns if not Faults table
    dateColumn = columns.find(name => name.includes('date')) || 
                columns.find(name => name.includes('validated')) ||
                columns.find(name => name.includes('created'));
    
    categoryColumn = columns.find(name => name.includes('category')) || 
                    columns.find(name => name.includes('classifier')) ||
                    columns.find(name => name.includes('type'));
    
    statusColumn = columns.find(name => name.includes('status'));
    
    // Look for equipment/machine identifiers
    equipmentColumn = columns.find(name => name.includes('terminal')) ||
                     columns.find(name => name.includes('machine')) ||
                     columns.find(name => name.includes('equipment')) ||
                     columns.find(name => name.includes('device')) ||
                     columns.find(name => name.includes('asset'));
    
    locationColumn = columns.find(name => name.includes('location')) ||
                    columns.find(name => name.includes('area')) ||
                    columns.find(name => name.includes('zone')) ||
                    columns.find(name => name.includes('site'));
    
    typeColumn = columns.find(name => name.includes('type')) ||
                columns.find(name => name.includes('maintenance')) ||
                columns.find(name => name.includes('work'));
  }
  
  console.log("Advanced analytics using columns:");
  console.log(`- Date: ${dateColumn}`);
  console.log(`- Equipment: ${equipmentColumn}`);
  console.log(`- Type: ${typeColumn}`);
  console.log(`- Location: ${locationColumn}`);
  
  // 1. Top machines with faults this month
  if (dateColumn && equipmentColumn) {
    analytics.topMachinesThisMonth = `
      SELECT TOP 10 
        ${equipmentColumn} as EquipmentID,
        COUNT(*) as FaultCount
      FROM ${tableName}
      WHERE ${dateColumn} >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
      GROUP BY ${equipmentColumn}
      ORDER BY FaultCount DESC
    `;
  }
  
  // 2. Top machines with faults last month
  if (dateColumn && equipmentColumn) {
    analytics.topMachinesLastMonth = `
      SELECT TOP 10 
        ${equipmentColumn} as EquipmentID,
        COUNT(*) as FaultCount
      FROM ${tableName}
      WHERE 
        ${dateColumn} >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0) AND
        ${dateColumn} < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
      GROUP BY ${equipmentColumn}
      ORDER BY FaultCount DESC
    `;
  }
  
  // 3. Preventive Maintenance (PM) count this month
  // Assuming PM can be identified by Type column containing 'PM' or 'Preventive'
  if (dateColumn && typeColumn) {
    analytics.pmThisMonth = `
      SELECT 
        COUNT(*) as PMCount
      FROM ${tableName}
      WHERE 
        ${dateColumn} >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND
        (${typeColumn} LIKE '%PM%' OR ${typeColumn} LIKE '%Preventive%')
    `;
  }
  
  // 4. Preventive Maintenance (PM) count last month
  if (dateColumn && typeColumn) {
    analytics.pmLastMonth = `
      SELECT 
        COUNT(*) as PMCount
      FROM ${tableName}
      WHERE 
        ${dateColumn} >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0) AND
        ${dateColumn} < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND
        (${typeColumn} LIKE '%PM%' OR ${typeColumn} LIKE '%Preventive%')
    `;
  }
  
  // 5. Average resolution time trend (by week)
  if (dateColumn && columns.includes('resolved')) {
    analytics.resolutionTimeTrend = `
      SELECT 
        DATEPART(year, ${dateColumn}) as Year,
        DATEPART(week, ${dateColumn}) as Week,
        AVG(DATEDIFF(hour, ${dateColumn}, resolved)) as AvgHours
      FROM ${tableName}
      WHERE 
        ${dateColumn} >= DATEADD(month, -3, GETDATE()) AND
        resolved IS NOT NULL
      GROUP BY DATEPART(year, ${dateColumn}), DATEPART(week, ${dateColumn})
      ORDER BY Year, Week
    `;
  }
  
  // 6. Faults by location/area
  if (dateColumn && locationColumn) {
    analytics.faultsByLocation = `
      SELECT 
        ${locationColumn} as Location,
        COUNT(*) as FaultCount
      FROM ${tableName}
      WHERE ${dateColumn} >= DATEADD(month, -3, GETDATE())
      GROUP BY ${locationColumn}
      ORDER BY FaultCount DESC
    `;
  }
  
  // 7. Recurring fault analysis (same machine, same category, within 7 days)
  if (dateColumn && equipmentColumn && categoryColumn) {
    analytics.recurringFaults = `
      WITH RecentFaults AS (
        SELECT 
          ${equipmentColumn} as EquipmentID,
          ${categoryColumn} as Category,
          ${dateColumn} as FaultDate
        FROM ${tableName}
        WHERE ${dateColumn} >= DATEADD(month, -3, GETDATE())
      )
      SELECT 
        rf.EquipmentID,
        rf.Category,
        COUNT(*) as RecurrenceCount
      FROM RecentFaults rf
      JOIN RecentFaults rf2 ON 
        rf.EquipmentID = rf2.EquipmentID AND
        rf.Category = rf2.Category AND
        rf.FaultDate > rf2.FaultDate AND
        DATEDIFF(day, rf2.FaultDate, rf.FaultDate) <= 7
      GROUP BY rf.EquipmentID, rf.Category
      HAVING COUNT(*) > 1
      ORDER BY RecurrenceCount DESC
    `;
  }
  
  // 8. Fault count trend by day (last 30 days)
  if (dateColumn) {
    analytics.dailyFaultTrend = `
      SELECT 
        CAST(${dateColumn} as DATE) as Date,
        COUNT(*) as FaultCount
      FROM ${tableName}
      WHERE ${dateColumn} >= DATEADD(day, -30, GETDATE())
      GROUP BY CAST(${dateColumn} as DATE)
      ORDER BY Date
    `;
  }
  
  // 9. Maintenance efficiency - time to resolve by category
  if (dateColumn && categoryColumn && columns.includes('resolved')) {
    analytics.resolutionByCategory = `
      SELECT 
        ${categoryColumn} as Category,
        AVG(DATEDIFF(hour, ${dateColumn}, resolved)) as AvgHours,
        MIN(DATEDIFF(hour, ${dateColumn}, resolved)) as MinHours,
        MAX(DATEDIFF(hour, ${dateColumn}, resolved)) as MaxHours
      FROM ${tableName}
      WHERE 
        ${dateColumn} >= DATEADD(month, -3, GETDATE()) AND
        resolved IS NOT NULL
      GROUP BY ${categoryColumn}
      ORDER BY AvgHours DESC
    `;
  }
  
  // 10. MTBF (Mean Time Between Failures) for top machines
  if (dateColumn && equipmentColumn) {
    analytics.mtbfTopMachines = `
      WITH EquipmentFaults AS (
        SELECT
          ${equipmentColumn} as EquipmentID,
          ${dateColumn} as FaultDate,
          LEAD(${dateColumn}) OVER (PARTITION BY ${equipmentColumn} ORDER BY ${dateColumn}) as NextFaultDate
        FROM ${tableName}
        WHERE ${dateColumn} >= DATEADD(year, -1, GETDATE())
      )
      SELECT TOP 10
        EquipmentID,
        COUNT(*) as FaultCount,
        AVG(DATEDIFF(hour, FaultDate, NextFaultDate)) as AvgHoursBetweenFailures
      FROM EquipmentFaults
      WHERE NextFaultDate IS NOT NULL
      GROUP BY EquipmentID
      ORDER BY FaultCount DESC
    `;
  }
  
  return analytics;
}



// Add to fetchDashboardData function to execute advanced analytics
async function fetchAdvancedAnalytics() {
  // Build advanced analytics queries
  const analyticsQueries = buildAdvancedAnalytics();
  
  // Initialize analytics data structure
  const analyticsData = {
    topMachinesThisMonth: [],
    topMachinesLastMonth: [],
    pmThisMonth: 0,
    pmLastMonth: 0,
    resolutionTimeTrend: [],
    faultsByLocation: [],
    recurringFaults: [],
    dailyFaultTrend: [],
    resolutionByCategory: [],
    mtbfTopMachines: []
  };
  
  // Execute each query if available
  for (const [key, query] of Object.entries(analyticsQueries)) {
    try {
      const result = await pool.request().query(query);
      
      // Special handling for PM counts which return single values
      if (key === 'pmThisMonth' && result.recordset.length > 0) {
        analyticsData.pmThisMonth = result.recordset[0].PMCount || 0;
      } 
      else if (key === 'pmLastMonth' && result.recordset.length > 0) {
        analyticsData.pmLastMonth = result.recordset[0].PMCount || 0;
      }
      else {
        analyticsData[key] = result.recordset;
      }
      
      console.log(`Successfully executed ${key} analytics`, 
                 key.includes('Machine') ? `Found ${result.recordset.length} machines` : '');
    } catch (err) {
      console.error(`Error executing ${key} analytics:`, err.message);
      // Keep the default empty array/value for this analytics
    }
  }
  
  return analyticsData;
}


// Function to send dashboard data
async function sendDashboardData(socket) {
  try {
    const data = await fetchDashboardData();
    socket.emit('dashboard-update', data);
  } catch (err) {
    console.error('Error sending dashboard data:', err);
  }
}

// Catch-all handler to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard available at http://10.1.1.20:${PORT}`);
  console.log(`Schema info API: http://10.1.1.20:${PORT}/api/schema-info`);
  console.log(`Table info API: http://10.1.1.20:${PORT}/api/table-info/{tableName}`);
  console.log(`Test query API: http://10.1.1.20:${PORT}/api/test-query/{tableName}`);
});
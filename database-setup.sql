-- Database Schema Documentation for Maintenance Dashboard

/*
This is a documentation file explaining the expected database schema for the maintenance dashboard.
The dashboard is designed to be READ-ONLY and will NOT modify any data in your database.

The dashboard expects a database with tables that contain maintenance ticket information.
Below is the expected schema structure that the dashboard queries will use.
You should ensure your database has a similar structure or modify the queries in server.js
to match your actual database schema.

IMPORTANT: The dashboard application does NOT create any tables or insert any data.
It ONLY reads from your existing database.
*/

-- Expected Database: MaintenanceDB (or replace with your actual database name)

-- Expected Table: MaintenanceTickets
/*
The dashboard expects a table similar to the following:

CREATE TABLE [MaintenanceTickets] (
    [ticket_id] [int] NOT NULL PRIMARY KEY,
    [title] [nvarchar](255) NOT NULL,
    [description] [nvarchar](max) NULL,
    [status] [nvarchar](50) NOT NULL,
    [priority] [nvarchar](50) NOT NULL,
    [category] [nvarchar](100) NOT NULL,
    [assigned_to] [nvarchar](100) NULL,
    [created_by] [nvarchar](100) NOT NULL,
    [created_date] [datetime] NOT NULL,
    [updated_date] [datetime] NULL,
    [resolved_date] [datetime] NULL,
    [resolution] [nvarchar](max) NULL
);

Expected status values: Open, InProgress, OnHold, Resolved, Closed
Expected priority values: Low, Medium, High, Critical
*/

-- Example Query Documentation
/*
The dashboard will run read-only queries similar to the following:

1. Status Distribution:
SELECT Status, COUNT(*) as Count FROM MaintenanceTickets GROUP BY Status

2. Priority Distribution:
SELECT Priority, COUNT(*) as Count FROM MaintenanceTickets GROUP BY Priority

3. Resolution Time by Category:
SELECT Category, AVG(DATEDIFF(hour, created_date, resolved_date)) as AvgHours
FROM MaintenanceTickets
WHERE status = 'Closed' AND resolved_date IS NOT NULL
GROUP BY Category

4. Tickets Created Over Time:
SELECT CAST(created_date as DATE) as Date, COUNT(*) as Count
FROM MaintenanceTickets
WHERE created_date >= DATEADD(day, -30, GETDATE())
GROUP BY CAST(created_date as DATE)

5. Top Maintenance Categories:
SELECT TOP 5 Category, COUNT(*) as Count
FROM MaintenanceTickets
GROUP BY Category
ORDER BY Count DESC

These queries are for reference only and can be adjusted in the server.js file
to match your actual database schema.
*/

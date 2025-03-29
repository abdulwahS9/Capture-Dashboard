# Real-Time Maintenance Dashboard

An AI-driven dashboard that connects to MS SQL Server to provide real-time insights into maintenance ticket data. The dashboard is designed to be hosted locally alongside the database.

## Features

- **Real-time Updates**: Live data with automatic updates via WebSockets
- **Interactive Visualizations**: Charts for ticket status, priority, resolution time, and more
- **AI-Driven Insights**: Automatically identifies key patterns and trends
- **Local Hosting**: Designed to run on-premises alongside your database
- **User-Friendly Interface**: Clear, intuitive design for management review
- **No Authentication Required**: Single-page view for quick access

## Installation Guide

### Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server (2016 or newer)
- Windows or Linux server with network access to the SQL Server

### Database Connection

1. The dashboard connects to your existing MS SQL Server database
2. No database modifications are made - the application is READ-ONLY
3. Review the database schema documentation (`database-schema.md`) to understand the expected table structure
4. Adjust the server's database queries if needed to match your actual database schema

### Backend Setup

1. Clone this repository to your server
2. Navigate to the server directory:
   ```
   cd maintenance-dashboard/server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Configure your database connection:
   - Open `server.js` and update the `sqlConfig` object with your database credentials
   ```javascript
   const sqlConfig = {
     user: 'your_username',         // Replace with your SQL Server username
     password: 'your_password',     // Replace with your SQL Server password
     server: 'localhost',           // Replace with your SQL Server hostname or IP
     database: 'MaintenanceDB',     // Replace with your database name
     options: {
       trustServerCertificate: true,
       enableArithAbort: true
     }
   };
   ```
5. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd maintenance-dashboard/client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Build for production:
   ```
   npm run build
   ```

### Production Deployment

1. Build the React frontend:
   ```
   cd client
   npm run build
   ```
2. Deploy the backend Node.js application as a Windows service or Linux daemon
3. Configure the server to start automatically on system boot
4. Set up monitoring to ensure continuous operation

## Project Structure

```
maintenance-dashboard/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       │   └── charts/     # Chart components
│       └── styles/         # CSS stylesheets
├── server/                 # Node.js backend
│   ├── server.js           # Main server file
│   └── package.json        # Server dependencies
└── database/               # Database scripts
    └── database-setup.sql  # SQL setup script
```

## Customizing the Dashboard

### Adding New Charts

1. Create a new chart component in `client/src/components/charts/`
2. Update the server's `fetchDashboardData` function to include the required data
3. Add the new chart to the Dashboard component

### Modifying Polling Frequency

1. Open `server.js` and change the polling interval (default: 10 seconds):
   ```javascript
   const intervalId = setInterval(() => {
     sendDashboardData(socket);
   }, 10000); // Change this value
   ```

### Connecting to Your Database Schema

1. Update the SQL queries in `server.js` to match your database schema
2. Update the chart components to match your data structure

## Troubleshooting

### Connection Issues

- Verify SQL Server credentials and connection string
- Ensure that SQL Server is accessible from the application server
- Check firewall settings to allow the required ports

### Performance Optimization

- Create indexed views in SQL Server for complex queries
- Implement caching for frequent queries
- Optimize the polling frequency based on your needs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

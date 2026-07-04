
/**
 * WarriorERP - cPanel/VPS Entry Point
 * This file serves as the Application Startup File for cPanel's Node.js Selector.
 * It routes requests to the optimized Next.js standalone build.
 */

const path = require('path');

// 1. Set environment to production
process.env.NODE_ENV = 'production';

// 2. Ensure the process directory is correctly set to the app root
// This helps resolve paths for 'public' and '.next/static'
process.chdir(__dirname);

// 3. Port Configuration
// cPanel/Passenger usually passes the port via an environment variable
const port = process.env.PORT || 3000;
process.env.PORT = port;

// 4. Load the Next.js standalone server
// Note: You must run 'npm run build' first to generate this directory.
try {
  require('./.next/standalone/server.js');
} catch (error) {
  console.error('Next.js standalone server not found. Please ensure you have run "npm run build" and uploaded the ".next" folder.');
  console.error(error);
}

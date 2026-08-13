
/**
 * WarriorERP - cPanel/VPS Production Entry Point
 * This file serves as the "Application Startup File" for cPanel's Node.js Selector.
 * It routes requests to the optimized Next.js standalone build.
 */

const path = require('path');

// 1. Set environment to production
process.env.NODE_ENV = 'production';

// 2. Ensure the process directory is correctly set to the app root
// This is critical for Passenger to find '.next' and 'public' folders
process.chdir(__dirname);

// 3. Port & Hostname Configuration
// cPanel/Passenger automatically provides a port via environment variables or a pipe
const port = process.env.PORT || 3000;
const hostname = 'localhost';

// 4. Load the Next.js standalone server
// Note: You must run 'npm run build' first to generate this directory.
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

try {
  console.log(`Starting WarriorERP Production Server on port ${port}...`);
  require(standaloneServerPath);
} catch (error) {
  console.error('CRITICAL ERROR: Next.js standalone server not found.');
  console.error('Please ensure you have followed these steps:');
  console.error('1. Run "npm run build" on your local machine.');
  console.error('2. Copy ".next/standalone" contents to your server root.');
  console.error('3. Copy ".next/static" to your server root/.next/static.');
  console.error('4. Copy "public" folder to your server root/public.');
  console.error('----------------------------------------------------');
  console.error(error);
  process.exit(1);
}

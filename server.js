
/**
 * Custom Server Entry Point for cPanel/VPS Hosting
 * This file allows Node.js hosting panels to correctly boot the Next.js standalone production build.
 */

const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

// Ensure the working directory is set to the application root
process.chdir(__dirname);

// Load the Next.js standalone server
// Note: This requires 'output: standalone' in next.config.ts
require('./.next/standalone/server.js');

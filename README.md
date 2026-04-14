# WarriorERP - Production Ready

This enterprise ERP is optimized for high-performance deployment on custom Node.js servers, VPS, or cPanel.

## Production Build & Deployment

### 1. Build the application
```bash
npm run build
```

### 2. Deployment Package
Next.js is configured in `standalone` mode. To deploy to your own server:
1. Copy the contents of `.next/standalone` to your server.
2. Copy the `public` folder to your server's root.
3. Copy `.next/static` into the `.next` folder on your server.
4. Use `server.js` as your application entry point in cPanel or PM2.

## Key Features
- **Dynamic Branding**: Managed via Settings module.
- **Role-Based Access**: Granular permissions for Sales, Accounts, HR, and more.
- **Bilingual Support**: Full English and Bangla localization.
- **Warehouse Management**: Brand and Model tracking with serial number support.
- **Financial Control**: Automated invoicing and combined project billing.

## Environment Variables
Ensure your Firebase configuration in `src/firebase/config.ts` matches your production project credentials.

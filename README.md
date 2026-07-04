
# WarriorERP - Production Deployment Guide

WarriorERP is optimized for high-performance deployment on **cPanel**, **VPS**, or **Dedicated Node.js** servers using Next.js Standalone mode.

## 🚀 How to Deploy to cPanel

### 1. Build the Application
On your local machine, run the following command to generate the optimized production build:
```bash
npm run build
```

### 2. Prepare the Deployment Package
Next.js generates an optimized server in the `.next/standalone` directory. To ensure all assets load correctly:
1.  Go to the `.next/standalone` folder.
2.  Copy the `public` folder from your root directory into `.next/standalone/`.
3.  Copy the `.next/static` folder from your root directory into `.next/standalone/.next/`.
4.  Create a ZIP file containing the **contents** of the `.next/standalone` folder.

### 3. Upload to cPanel
1.  Log in to your cPanel.
2.  Open **File Manager** and upload the ZIP file to your domain's root directory (e.g., `public_html` or a subfolder).
3.  Extract the ZIP file.

### 4. Setup Node.js App in cPanel
1.  Open **Setup Node.js App** in cPanel.
2.  Click **Create Application**.
3.  **Node.js version**: Select 18.x or 20.x (Latest recommended).
4.  **Application mode**: Production.
5.  **Application root**: The folder where you extracted the files (e.g., `public_html`).
6.  **Application URL**: Your domain or subdomain.
7.  **Application startup file**: `server.js`.
8.  Click **Create**.

### 5. Install Dependencies
1.  In the Node.js App interface, scroll down to the "Configuration files" section.
2.  Click **Run JS Build** if available, or simply click **npm install** (this will install the minimal production dependencies listed in your standalone package).

### 6. Environment Variables
Ensure you add any necessary environment variables (like `GEMINI_API_KEY` for AI features) in the **Setup Node.js App** interface under the "Environment variables" section.

---

## 🛠 Features
- **Standalone Build**: Only 10% the size of a standard build.
- **Fast Startup**: Optimized for Phusion Passenger (cPanel's Node handler).
- **Static Asset Routing**: Pre-configured to serve images and CSS efficiently.

**Warrior Tech System © 2024**

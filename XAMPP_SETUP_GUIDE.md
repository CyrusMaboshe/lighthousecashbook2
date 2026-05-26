
# Lighthouse Cash Book - XAMPP Setup Guide

## Complete Step-by-Step Installation Guide for Beginners

### Prerequisites
- Windows PC
- Internet connection for downloading software

### Step 1: Download and Install XAMPP

1. **Download XAMPP:**
   - Visit: https://www.apachefriends.org/download.html
   - Download the latest version for Windows (usually around 150MB)
   - Choose the version with PHP 8.0 or higher

2. **Install XAMPP:**
   - Run the downloaded installer as Administrator
   - Click "Next" through the installation wizard
   - Install to the default location: `C:\xampp`
   - Wait for installation to complete (5-10 minutes)

### Step 2: Start XAMPP Services

1. **Open XAMPP Control Panel:**
   - Search for "XAMPP Control Panel" in Windows Start menu
   - Run as Administrator

2. **Start Required Services:**
   - Click "Start" next to "Apache" (web server)
   - Click "Start" next to "MySQL" (database server)
   - Both should show green "Running" status

### Step 3: Download the Application

1. **Download Project Files:**
   - Download all project files from your source
   - Extract to: `C:\xampp\htdocs\lighthouse-cashbook\`

### Step 4: Set Up the Database

1. **Open phpMyAdmin:**
   - Open your web browser
   - Go to: http://localhost/phpmyadmin
   - Click on "New" on the left sidebar

2. **Create Database:**
   - Database name: `lighthouse_cashbook`
   - Click "Create"

3. **Import Database Schema:**
   - Click on the `lighthouse_cashbook` database you just created
   - Click on "SQL" tab at the top
   - Copy the entire content from `backend-reference/database/schema-updated.sql`
   - Paste it into the SQL text area
   - Click "Go" to execute

### Step 5: Configure the Application

1. **Backend Configuration:**
   - Navigate to `C:\xampp\htdocs\lighthouse-cashbook\backend-reference\config\`
   - Open `database.php` in a text editor (Notepad++)
   - Verify the configuration matches:
     ```php
     private $host = "localhost";
     private $db_name = "lighthouse_cashbook";
     private $username = "root";
     private $password = "";
     ```

2. **Frontend Configuration:**
   - The React frontend is already configured for development

### Step 6: Access the Application

1. **Start the Application:**
   - Open your web browser
   - Go to: http://localhost/lighthouse-cashbook
   - You should see the login page

2. **Default Login Credentials:**
   - Username: `Cyrus Maboshe`
   - Password: `titanium`

### Step 7: Test All Features

1. **Test Basic Functionality:**
   - Login with admin credentials
   - Add a cash-in transaction
   - Add a cash-out transaction
   - Print a receipt
   - Send a message
   - Create a notification

2. **Test Database Operations:**
   - All data should be saved to the database
   - Check phpMyAdmin to see the data

### Folder Structure
```
C:\xampp\htdocs\lighthouse-cashbook\
├── src/                          (React frontend source)
├── public/                       (Public assets)
├── backend-reference/
│   ├── api/                     (PHP API endpoints)
│   │   ├── auth.php
│   │   ├── transactions.php
│   │   ├── notifications.php
│   │   ├── messages.php
│   │   └── categories.php
│   ├── config/
│   │   └── database.php         (Database configuration)
│   └── database/
│       └── schema-updated.sql   (Database schema)
├── dist/                        (Built frontend files)
└── XAMPP_SETUP_GUIDE.md       (This file)
```

### Key Features Available

1. **Transaction Management:**
   - Add cash-in/cash-out transactions with timestamp
   - Print receipts for each transaction
   - View transaction history

2. **Messaging System:**
   - Chat interface between admin and users
   - Message history retention
   - Real-time messaging

3. **Notification System:**
   - Create notifications with priorities
   - Separate new and old notifications
   - Archive functionality

4. **Receipt Printing:**
   - Professional receipt format
   - Lighthouse Media branding
   - Transaction details with date/time

5. **User Management:**
   - Admin and user roles
   - User preferences
   - Access control

6. **Reporting:**
   - PDF export functionality
   - Financial summaries
   - Top customers analysis

### Troubleshooting

1. **Apache Won't Start:**
   - Close Skype (uses port 80)
   - Check Windows IIS is disabled
   - Run XAMPP as Administrator

2. **MySQL Won't Start:**
   - Check if another MySQL service is running
   - Restart your computer
   - Change MySQL port in XAMPP config

3. **Database Connection Error:**
   - Verify MySQL is running in XAMPP
   - Check database credentials in `database.php`
   - Ensure database `lighthouse_cashbook` exists

4. **Application Not Loading:**
   - Check file permissions
   - Verify files are in correct directory
   - Clear browser cache

### Daily Usage

1. **Starting Work:**
   - Open XAMPP Control Panel
   - Start Apache and MySQL
   - Open browser to http://localhost/lighthouse-cashbook

2. **Ending Work:**
   - Close the application
   - Stop Apache and MySQL in XAMPP
   - Close XAMPP Control Panel

### Data Backup

1. **Regular Backup:**
   - Go to phpMyAdmin
   - Select `lighthouse_cashbook` database
   - Click "Export"
   - Download the SQL file
   - Save to a safe location

2. **Restore Backup:**
   - Go to phpMyAdmin
   - Select `lighthouse_cashbook` database
   - Click "Import"
   - Choose your backup SQL file
   - Click "Go"

### Support

For technical issues:
1. Check this guide first
2. Verify XAMPP services are running
3. Check browser console for errors
4. Ensure database connection is working

The application is now fully configured for local use with all requested features:
- Chat-like messaging system
- Receipt printing with Lighthouse Media branding
- Timestamp functionality
- Extended year selection (2020-2050)
- Enhanced notification system with old/new categories
- Complete database integration for XAMPP

All data is stored locally in your MySQL database and will persist between sessions.

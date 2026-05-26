
# Lighthouse Cash Book - PHP Backend

This directory contains the PHP backend files for the Lighthouse Cash Book application.

## Setup Instructions

### 1. XAMPP Installation
1. Download and install XAMPP from https://www.apachefriends.org/
2. Start Apache and MySQL services

### 2. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Import the `database/schema.sql` file to create the database and tables
3. The default admin user will be created:
   - Username: Cyrus Maboshe
   - Password: titanium

### 3. File Structure
Copy these files to your XAMPP htdocs directory:
```
htdocs/
├── lighthouse-cashbook/
│   ├── config/
│   │   └── database.php
│   ├── api/
│   │   ├── auth.php
│   │   ├── transactions.php
│   │   └── categories.php
│   └── index.php (your main application file)
```

### 4. API Endpoints

#### Authentication
- `POST /api/auth.php` - Login/Logout
  - Body: `{"action": "login", "username": "...", "password": "..."}`
  - Body: `{"action": "logout"}`

#### Transactions
- `GET /api/transactions.php?year=2024&month=0` - Get transactions
- `POST /api/transactions.php` - Create transaction
- `PUT /api/transactions.php` - Update transaction (admin only)
- `DELETE /api/transactions.php` - Delete transaction (admin only)

#### Categories
- `GET /api/categories.php` - Get all categories

### 5. Frontend Integration
Update your React application to use these PHP endpoints instead of localStorage:

1. Replace localStorage calls with fetch requests to PHP APIs
2. Handle authentication with sessions
3. Update state management to work with server responses

### 6. Security Considerations
- Enable HTTPS in production
- Use environment variables for database credentials
- Implement proper input validation and sanitization
- Add rate limiting for API endpoints
- Use CSRF tokens for form submissions

### 7. Next Steps
1. Test each API endpoint using Postman or similar tool
2. Gradually migrate frontend components to use PHP APIs
3. Implement file upload functionality if needed
4. Add proper error handling and logging

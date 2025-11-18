# Create MySQL Database - Instructions

## Option 1: Using the Automated Script (Recommended)

### Step 1: Start MySQL Server

**If using MySQL as a Windows Service:**
```powershell
# Start MySQL service
Start-Service MySQL80
# Or
net start MySQL80
```

**If using XAMPP:**
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL

**If using WAMP:**
1. Open WAMP Control Panel
2. Click "Start" next to MySQL

**If using MySQL Workbench:**
- MySQL should start automatically when you open Workbench

### Step 2: Run the Setup Script

Once MySQL is running, execute:

```powershell
cd server
node scripts/create-database.js
```

This will:
- ✅ Connect to MySQL
- ✅ Create the database `invMod` (or `leadtime_lense` if you change DB_NAME)
- ✅ Import all tables from `mysql_schema.sql`
- ✅ Show you all created tables

---

## Option 2: Manual Setup (If script doesn't work)

### Step 1: Connect to MySQL

**Using MySQL Command Line:**
```bash
mysql -u root -p
# Enter password: 123321
```

**Using MySQL Workbench:**
- Open MySQL Workbench
- Connect to localhost with username `root` and password `123321`

### Step 2: Create Database

```sql
CREATE DATABASE IF NOT EXISTS invMod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE invMod;
```

### Step 3: Import Schema

**From Command Line:**
```bash
mysql -u root -p invMod < mysql_schema.sql
```

**From MySQL Workbench:**
1. File → Open SQL Script
2. Select `mysql_schema.sql`
3. Click the Execute button (⚡)

---

## Option 3: Using MySQL Extension in Cursor

If you have the MySQL extension in Cursor:

1. Open the MySQL extension panel
2. Connect to your MySQL server:
   - Host: `localhost`
   - Port: `3306`
   - User: `root`
   - Password: `123321`
3. Right-click → "New Query"
4. Run: `CREATE DATABASE IF NOT EXISTS invMod;`
5. Right-click on `invMod` database → "Run SQL File"
6. Select `mysql_schema.sql`

---

## Verify Database Was Created

Run this query:

```sql
USE invMod;
SHOW TABLES;
```

You should see tables like:
- `vendors`
- `inventory_items`
- `projects`
- `claims`
- `returns`
- etc.

---

## Troubleshooting

### "Can't connect to MySQL server"
- ✅ Make sure MySQL service is running
- ✅ Check if MySQL is listening on port 3306
- ✅ Verify username/password in `server/.env`

### "Access denied for user"
- ✅ Check password in `server/.env` matches your MySQL password
- ✅ Try: `mysql -u root -p` to test connection manually

### "Unknown database"
- ✅ The script will create it automatically
- ✅ Or create manually: `CREATE DATABASE invMod;`

---

## Current Configuration

Based on your `server/.env`:
- **Database Name**: `invMod`
- **Username**: `root`
- **Password**: `123321`
- **Host**: `localhost`
- **Port**: `3306`

---

## Next Steps After Database Creation

1. ✅ Database created
2. ✅ Start backend server: `cd server && npm run dev`
3. ✅ Should see: "✅ MySQL database connected successfully"
4. ✅ Test: `curl http://localhost:3001/health`


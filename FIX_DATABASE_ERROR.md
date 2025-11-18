# Fix: "Unknown database 'leadtime_lense'" Error

## 🔴 Error Message
```
❌ MySQL database connection failed: Unknown database 'leadtime_lense'
```

## ✅ Solution: Create the Database

The database `leadtime_lense` doesn't exist yet. You need to create it first.

### Method 1: Using phpMyAdmin (Easiest)

1. **Open phpMyAdmin:**
   - Go to: `http://localhost/phpmyadmin`
   - Or click "Admin" button next to MySQL in XAMPP Control Panel

2. **Create Database:**
   - Click "New" in left sidebar
   - Database name: `leadtime_lense`
   - Collation: `utf8mb4_unicode_ci` (optional)
   - Click "Create"

3. **Import Schema:**
   - Select `leadtime_lense` database
   - Click "Import" tab
   - Click "Choose File"
   - Select `mysql_schema.sql` from your project folder
   - Click "Go"

### Method 2: Using Command Line

**Step 1: Create Database**
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE leadtime_lense;"
```

**Step 2: Import Schema**
```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense"
C:\xampp\mysql\bin\mysql.exe -u root leadtime_lense < mysql_schema.sql
```

### Method 3: Using MySQL Command Line

1. **Connect to MySQL:**
   ```powershell
   C:\xampp\mysql\bin\mysql.exe -u root
   ```

2. **Create Database:**
   ```sql
   CREATE DATABASE leadtime_lense;
   ```

3. **Use Database:**
   ```sql
   USE leadtime_lense;
   ```

4. **Import Schema:**
   ```sql
   SOURCE W:/Actual Work/Inv Mod/leadtime-lense/mysql_schema.sql;
   ```
   
   Or exit MySQL and use:
   ```powershell
   C:\xampp\mysql\bin\mysql.exe -u root leadtime_lense < mysql_schema.sql
   ```

---

## ✅ After Creating Database

1. **Restart Backend Server:**
   ```powershell
   cd server
   npm run dev
   ```

2. **You should see:**
   ```
   ✅ MySQL database connected successfully
   🚀 Server running on http://localhost:3001
   ```

3. **Test:**
   - Health: `http://localhost:3001/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

---

## 🔍 Verify Database Exists

Check if database was created:
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "SHOW DATABASES LIKE 'leadtime_lense';"
```

Should show:
```
+-------------------+
| Database (leadtime_lense) |
+-------------------+
| leadtime_lense    |
+-------------------+
```

---

## 📝 Quick Fix Summary

**The Problem:** Database `leadtime_lense` doesn't exist

**The Solution:** Create it using one of the methods above

**After Fix:** Restart backend server - it will connect successfully!


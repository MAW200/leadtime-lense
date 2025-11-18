# How to Start MySQL and Create Database

## 🔍 Current Status

- ❌ MySQL server is NOT running (port 3306 not accessible)
- ✅ Database setup script is ready
- ✅ Configuration is set (root/123321)

## 🚀 Option 1: Start MySQL via MySQL Workbench (Easiest)

1. **Open MySQL Workbench**

   - Search for "MySQL Workbench" in Windows Start menu
   - Or find it in: `C:\Program Files\MySQL\MySQL Workbench 8.0 CE\`

2. **Connect to Server**

   - Click on your local connection (usually "Local instance MySQL80" or similar)
   - Enter password: `123321`
   - Click "OK"

3. **MySQL will start automatically** when you connect!

4. **Then run the setup script:**
   ```powershell
   cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
   node scripts/create-database.js
   ```

---

## 🚀 Option 2: Start MySQL Service (If installed as Windows Service)

```powershell
# Try to start MySQL service
net start MySQL80

# Or try MySQL57, MySQL, etc.
net start MySQL57
net start MySQL
```

**Check if service exists:**

```powershell
Get-Service | Where-Object { $_.Name -like "*mysql*" }
```

**If service exists but won't start:**

```powershell
# Run PowerShell as Administrator, then:
Start-Service MySQL80
```

---

## 🚀 Option 3: Use XAMPP/WAMP (If installed)

### XAMPP:

1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for green indicator

### WAMP:

1. Open WAMP Control Panel
2. Click "Start" next to MySQL
3. Wait for icon to turn green

**Then run:**

```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
node scripts/create-database.js
```

---

## 🚀 Option 4: Use MySQL Extension in Cursor

Since you mentioned having a MySQL extension in Cursor:

1. **Open MySQL Extension Panel** in Cursor
2. **Add New Connection:**

   - Host: `localhost` or `127.0.0.1`
   - Port: `3306`
   - Username: `root`
   - Password: `123321`
   - Database: (leave empty for now)

3. **Connect** - This should start MySQL if it's configured to auto-start

4. **Run SQL Script:**
   - Right-click on connection → "New Query"
   - Or use the extension's SQL runner
   - Copy contents of `mysql_schema.sql`
   - Execute it

---

## ✅ Verify MySQL is Running

After starting MySQL, test connection:

```powershell
# Test port 3306
Test-NetConnection -ComputerName localhost -Port 3306

# Should show: TcpTestSucceeded : True
```

Or run the setup script - it will tell you if MySQL is running:

```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
node scripts/create-database.js
```

---

## 🎯 Quick Test Script

Run this to check MySQL status:

```powershell
# Check if MySQL is running
$port = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet
if ($port) {
    Write-Host "✅ MySQL is running on port 3306" -ForegroundColor Green
    Write-Host "You can now run: cd server; node scripts/create-database.js"
} else {
    Write-Host "❌ MySQL is NOT running" -ForegroundColor Red
    Write-Host "Please start MySQL using one of the options above"
}
```

---

## 📝 After MySQL Starts

Once MySQL is running, execute:

```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense\server"
node scripts/create-database.js
```

You should see:

```
✅ Connected to MySQL server
✅ Database 'invMod' created or already exists
✅ Schema imported successfully!
📊 Created 20+ tables
🎉 Database setup complete!
```

---

## 🆘 Still Can't Start MySQL?

1. **Check if MySQL is installed:**

   - Look for MySQL in Windows Programs
   - Check `C:\Program Files\MySQL\`
   - Check if XAMPP/WAMP is installed

2. **Install MySQL if needed:**

   - Download MySQL Installer: https://dev.mysql.com/downloads/installer/
   - Or install XAMPP: https://www.apachefriends.org/
   - Or use MySQL Workbench (includes MySQL server)

3. **Check firewall:**
   - Windows Firewall might be blocking port 3306
   - Temporarily disable to test

---

## 💡 Recommended: Use MySQL Workbench

MySQL Workbench is the easiest way:

- ✅ Automatically starts MySQL when you connect
- ✅ Visual interface
- ✅ Can run SQL scripts easily
- ✅ Shows all databases and tables

**Steps:**

1. Open MySQL Workbench
2. Connect to localhost (root/123321)
3. File → Open SQL Script → Select `mysql_schema.sql`
4. Click Execute (⚡)

Done! 🎉

# How to Create Database in MySQL (XAMPP)

## Method 1: Using phpMyAdmin (Easiest) ✅

### Step 1: Open phpMyAdmin
1. Open your web browser
2. Go to: `http://localhost/phpmyadmin`
   - Or click the **"Admin"** button next to MySQL in XAMPP Control Panel

### Step 2: Create Database
1. Click on **"New"** in the left sidebar (or "Databases" tab at the top)
2. In the **"Database name"** field, type: `leadtime_lense`
3. Choose **"utf8mb4_unicode_ci"** from the Collation dropdown (optional, but recommended)
4. Click **"Create"** button

### Step 3: Verify
- You should see `leadtime_lense` appear in the left sidebar
- Click on it to see it's empty (no tables yet)

---

## Method 2: Using MySQL Command Line

### Step 1: Open MySQL Command Line
1. Open **Command Prompt** or **PowerShell**
2. Navigate to XAMPP MySQL directory:
   ```powershell
   cd C:\xampp\mysql\bin
   ```

### Step 2: Connect to MySQL
```powershell
mysql.exe -u root -p
```
- When prompted for password, press **Enter** (XAMPP default is empty)
- You should see: `mysql>`

### Step 3: Create Database
```sql
CREATE DATABASE leadtime_lense;
```

### Step 4: Verify
```sql
SHOW DATABASES;
```
- You should see `leadtime_lense` in the list

### Step 5: Exit MySQL
```sql
EXIT;
```

---

## Method 3: Using SQL File (After Creating Database)

Once the database is created, you can import the schema:

### Using phpMyAdmin:
1. Select `leadtime_lense` database
2. Click **"Import"** tab
3. Click **"Choose File"**
4. Select `mysql_schema.sql` from your project
5. Click **"Go"**

### Using Command Line:
```powershell
cd "W:\Actual Work\Inv Mod\leadtime-lense"
mysql.exe -u root leadtime_lense < mysql_schema.sql
```

---

## Quick Visual Guide (phpMyAdmin)

```
1. Open: http://localhost/phpmyadmin
2. Click "New" (left sidebar)
3. Database name: leadtime_lense
4. Collation: utf8mb4_unicode_ci
5. Click "Create"
```

---

## Troubleshooting

### "Access denied" Error
- Make sure MySQL is running in XAMPP
- Try password: (empty/blank) or `root`

### Database Already Exists
If you see "Database already exists":
- That's fine! The database is already created
- You can skip this step and proceed to import schema

### Can't Access phpMyAdmin
- Make sure Apache is running in XAMPP (optional, but helps)
- Try: `http://127.0.0.1/phpmyadmin` instead

---

## Next Steps After Creating Database

1. ✅ Database created: `leadtime_lense`
2. ⏭️ Import schema: Run `mysql_schema.sql` to create all tables
3. ⏭️ Start backend: `cd server && npm run dev`
4. ⏭️ Test: Check `http://localhost:3001/health`


# Database Configuration

## ✅ Current Setup

Your backend is configured to use the `invmod` database:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=invmod
PORT=3001
```

## 🔍 Verification

### Check Database Exists

In phpMyAdmin:
1. Open: `http://localhost/phpmyadmin`
2. Check if `invmod` database exists in the left sidebar
3. Click on it to see tables

### Verify Backend Connection

When you start the backend server:
```bash
cd server
npm run dev
```

You should see:
```
✅ MySQL database connected successfully
🚀 Server running on http://localhost:3001
```

If you see an error like `Unknown database 'invmod'`, the database doesn't exist yet.

---

## 📋 Next Steps

### If Database Doesn't Exist

**Option 1: Create in phpMyAdmin**
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click "New" in left sidebar
3. Database name: `invmod`
4. Click "Create"

**Option 2: Import Schema**
After creating the database:
1. Select `invmod` database
2. Click "Import" tab
3. Choose `mysql_schema.sql` file
4. Click "Go"

### If Database Exists

Just restart your backend server - it should connect automatically!

---

## 🔧 Troubleshooting

### "Unknown database 'invmod'"
- Database doesn't exist
- Create it using phpMyAdmin (see above)

### "Access denied"
- Check MySQL credentials in `server/.env`
- XAMPP default: `DB_PASSWORD=` (empty)

### Connection refused
- Make sure MySQL is running in XAMPP
- Check XAMPP Control Panel - MySQL should be green

---

## ✅ Summary

- **Database Name:** `invmod` ✅
- **Configuration:** Already set in `server/.env` ✅
- **Backend:** Will connect to `invmod` automatically ✅

Just make sure the `invmod` database exists in phpMyAdmin!


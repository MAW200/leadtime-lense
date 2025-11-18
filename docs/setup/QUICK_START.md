# Quick Start Guide: MySQL Migration

Get your application running with MySQL in 5 minutes!

## 🚀 Quick Setup

### 1. Create MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE leadtime_lense;

# Import schema
mysql -u root -p leadtime_lense < mysql_schema.sql
```

### 2. Set Up Backend

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=leadtime_lense

# Start backend server
npm run dev
```

✅ Backend should be running on `http://localhost:3001`

### 3. Update Frontend

```bash
# In root directory, create/update .env
echo "VITE_API_URL=http://localhost:3001/api" >> .env

# Start frontend (in a new terminal)
npm run dev
```

✅ Frontend should be running on `http://localhost:5173`

## 🧪 Test It Works

### Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Get inventory (should return empty array or your data)
curl http://localhost:3001/api/inventory
```

### Test Frontend

1. Open `http://localhost:5173`
2. Check browser console for errors
3. Try viewing inventory/projects

## 📝 Next Steps

1. **Update Hooks**: Start migrating hooks from Supabase to API client
   - See `MIGRATION_STEPS.md` for detailed instructions
   - Example hooks are ready in `src/lib/api.ts`

2. **Test Features**: 
   - Create a project
   - Submit a claim
   - View notifications

3. **Production**: 
   - Set up production MySQL database
   - Deploy backend API
   - Update frontend API URL

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Check .env file exists
cat server/.env

# Check port 3001 is free
lsof -i :3001
```

### Frontend can't connect
```bash
# Check backend is running
curl http://localhost:3001/health

# Check .env has API URL
cat .env | grep VITE_API_URL
```

### Database connection errors
- Verify MySQL credentials in `server/.env`
- Check database exists: `SHOW DATABASES;`
- Verify user has permissions

## 📚 Documentation

- **Backend API**: See `server/README.md`
- **Migration Guide**: See `MIGRATION_STEPS.md`
- **MySQL Schema**: See `mysql_schema.sql`

## ✅ Checklist

- [ ] MySQL database created
- [ ] Schema imported
- [ ] Backend dependencies installed
- [ ] Backend `.env` configured
- [ ] Backend server running
- [ ] Frontend `.env` has `VITE_API_URL`
- [ ] Frontend running
- [ ] Health check passes
- [ ] Can view inventory in frontend

---

**You're ready to start migrating!** 🎉


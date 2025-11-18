# Connect to AWS RDS MySQL Database

## 🔧 Configuration Steps

### Step 1: Get AWS RDS Connection Details

You'll need these details from your AWS RDS instance:

- **Host:** Your RDS endpoint (e.g., `your-db.xxxxx.us-east-1.rds.amazonaws.com`)
- **Port:** Usually `3306` (default MySQL port)
- **Database Name:** Your database name (e.g., `invmod` or `leadtime_lense`)
- **Username:** Your RDS master username
- **Password:** Your RDS master password

### Step 2: Update Backend Configuration

Edit `server/.env` file:

```env
# AWS RDS MySQL Configuration
DB_HOST=your-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=invmod
PORT=3001
```

**Replace:**
- `your-db.xxxxx.us-east-1.rds.amazonaws.com` → Your actual RDS endpoint
- `your_username` → Your RDS username
- `your_password` → Your RDS password
- `invmod` → Your database name (or `leadtime_lense`)

### Step 3: Security Group Configuration

Make sure your AWS RDS security group allows inbound connections:

1. **Go to AWS Console** → RDS → Your Database → Connectivity & Security
2. **Click on Security Group**
3. **Edit Inbound Rules**
4. **Add Rule:**
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: 
     - **For Development:** Your IP address (`x.x.x.x/32`)
     - **For Production:** Specific IP or VPC only

### Step 4: Test Connection

Restart your backend server:

```bash
cd server
npm run dev
```

You should see:
```
✅ MySQL database connected successfully
🚀 Server running on http://localhost:3001
```

If you see connection errors, check:
- Security group allows your IP
- Database credentials are correct
- RDS instance is running
- Network connectivity

---

## 🔒 Security Best Practices

### 1. Use Environment Variables (✅ Already Done)

Your `.env` file is already configured correctly. **Never commit `.env` to git!**

### 2. Use SSL Connection (Recommended)

Update `server/src/config/database.js` to use SSL:

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // For AWS RDS
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
```

### 3. Restrict Security Group

- **Development:** Only allow your IP address
- **Production:** Only allow your application server IPs
- **Never:** Allow `0.0.0.0/0` (all IPs) unless absolutely necessary

### 4. Use IAM Database Authentication (Advanced)

For better security, consider using IAM database authentication instead of passwords.

---

## 🔄 Switching Between Local and AWS

### Option 1: Use Different .env Files

Create separate environment files:

**`server/.env.local`** (for local XAMPP):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=invmod
```

**`server/.env.aws`** (for AWS RDS):
```env
DB_HOST=your-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=invmod
```

Then copy the one you want:
```bash
# Use local
cp .env.local .env

# Use AWS
cp .env.aws .env
```

### Option 2: Use Environment Variables

Set environment variables before starting:

**Windows PowerShell:**
```powershell
$env:DB_HOST="your-db.xxxxx.us-east-1.rds.amazonaws.com"
$env:DB_USER="your_username"
$env:DB_PASSWORD="your_password"
$env:DB_NAME="invmod"
npm run dev
```

**Linux/Mac:**
```bash
export DB_HOST="your-db.xxxxx.us-east-1.rds.amazonaws.com"
export DB_USER="your_username"
export DB_PASSWORD="your_password"
export DB_NAME="invmod"
npm run dev
```

---

## 📋 Checklist

Before connecting to AWS:

- [ ] Have AWS RDS endpoint URL
- [ ] Have database username and password
- [ ] Security group allows your IP (port 3306)
- [ ] Database exists in RDS
- [ ] Schema imported (run `mysql_schema.sql` on AWS database)
- [ ] Updated `server/.env` with AWS credentials
- [ ] Tested connection

---

## 🐛 Troubleshooting

### "Access Denied" Error

- Check username/password in `.env`
- Verify user has permissions on the database
- Check security group allows your IP

### "Connection Timeout"

- Security group doesn't allow your IP
- RDS instance is not publicly accessible
- Check network connectivity

### "Unknown Database"

- Database doesn't exist in RDS
- Wrong database name in `.env`
- Create database: `CREATE DATABASE invmod;`

### "SSL Required"

- Add SSL configuration to database.js (see above)
- Or disable SSL requirement in RDS settings (not recommended)

---

## 🚀 Production Deployment

For production deployment:

1. **Use Environment Variables** (not .env file)
2. **Enable SSL** connections
3. **Restrict Security Group** to application servers only
4. **Use Connection Pooling** (already configured ✅)
5. **Monitor Connection Limits** (RDS has connection limits)

---

## 📝 Example .env for AWS

```env
# AWS RDS MySQL Configuration
DB_HOST=leadtime-lense-db.abc123.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=invmod
PORT=3001

# Optional: CORS origins for production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

---

## ✅ Summary

1. **Get AWS RDS details** (endpoint, username, password)
2. **Update `server/.env`** with AWS credentials
3. **Configure Security Group** to allow your IP
4. **Restart backend server**
5. **Test connection** - should see "✅ MySQL database connected successfully"

Your application will now use the AWS database instead of local XAMPP! 🎉


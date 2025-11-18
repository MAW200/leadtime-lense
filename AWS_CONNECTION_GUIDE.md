# Connect to AWS RDS MySQL Database

## ✅ Yes! You Can Connect to AWS Database

Your application is already configured to connect to any MySQL database, including AWS RDS. Just update the connection settings!

---

## 🔧 Quick Setup

### Step 1: Get Your AWS RDS Details

From AWS Console → RDS → Your Database, you need:

1. **Endpoint** (e.g., `your-db.abc123.us-east-1.rds.amazonaws.com`)
2. **Port** (usually `3306`)
3. **Database Name** (e.g., `invmod`)
4. **Username** (master username)
5. **Password** (master password)

### Step 2: Update `server/.env` File

Edit `server/.env` and replace with your AWS RDS details:

```env
# AWS RDS MySQL Configuration
DB_HOST=your-db.abc123.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=your_aws_username
DB_PASSWORD=your_aws_password
DB_NAME=invmod

# Optional: Enable SSL for AWS RDS (recommended)
DB_SSL=true

PORT=3001
```

**Replace:**
- `your-db.abc123.us-east-1.rds.amazonaws.com` → Your RDS endpoint
- `your_aws_username` → Your RDS username  
- `your_aws_password` → Your RDS password
- `invmod` → Your database name

### Step 3: Configure AWS Security Group

**Important:** Your RDS security group must allow connections from your IP.

1. Go to **AWS Console** → **RDS** → Your Database
2. Click **Connectivity & Security** tab
3. Click on the **Security Group** link
4. Click **Edit Inbound Rules**
5. **Add Rule:**
   - Type: `MySQL/Aurora`
   - Port: `3306`
   - Source: `My IP` (or your specific IP: `x.x.x.x/32`)
6. Click **Save Rules**

### Step 4: Restart Backend Server

```bash
cd server
npm run dev
```

You should see:
```
✅ MySQL database connected successfully
🚀 Server running on http://localhost:3001
```

---

## 🔄 Switching Between Local and AWS

### Option 1: Use Different .env Files

**Create `server/.env.local`** (for XAMPP):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=invmod
DB_SSL=false
```

**Create `server/.env.aws`** (for AWS):
```env
DB_HOST=your-db.abc123.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=your_aws_username
DB_PASSWORD=your_aws_password
DB_NAME=invmod
DB_SSL=true
```

**Switch between them:**
```bash
# Use local
cp .env.local .env

# Use AWS
cp .env.aws .env
```

### Option 2: Comment/Uncomment in .env

Keep both configurations in `.env` and comment/uncomment:

```env
# Local XAMPP
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_SSL=false

# AWS RDS
DB_HOST=your-db.abc123.us-east-1.rds.amazonaws.com
DB_USER=your_aws_username
DB_PASSWORD=your_aws_password
DB_SSL=true
```

---

## 🔒 Security Best Practices

### 1. Enable SSL (Recommended)

I've updated the code to support SSL. Just add to `.env`:
```env
DB_SSL=true
```

### 2. Restrict Security Group

- **Development:** Only allow your IP address
- **Production:** Only allow your application server IPs
- **Never:** Allow `0.0.0.0/0` (all IPs) unless absolutely necessary

### 3. Use Strong Passwords

Make sure your RDS master password is strong and secure.

### 4. Never Commit .env

Your `.env` file should be in `.gitignore` (it already is ✅)

---

## 📋 Checklist

Before connecting:

- [ ] Have AWS RDS endpoint URL
- [ ] Have database username and password
- [ ] Security group allows your IP (port 3306)
- [ ] Database exists in RDS
- [ ] Schema imported (if needed - run `mysql_schema.sql` on AWS)
- [ ] Updated `server/.env` with AWS credentials
- [ ] Set `DB_SSL=true` (optional but recommended)
- [ ] Tested connection

---

## 🐛 Troubleshooting

### "Access Denied" Error

- ✅ Check username/password in `.env`
- ✅ Verify user has permissions on the database
- ✅ Check security group allows your IP

### "Connection Timeout"

- ✅ Security group doesn't allow your IP → Update security group
- ✅ RDS instance is not publicly accessible → Enable public access or use VPN
- ✅ Check network connectivity → Try pinging the endpoint

### "Unknown Database"

- ✅ Database doesn't exist in RDS → Create it
- ✅ Wrong database name in `.env` → Check database name
- ✅ Create database: `CREATE DATABASE invmod;`

### "SSL Required"

- ✅ Add `DB_SSL=true` to `.env`
- ✅ Or disable SSL requirement in RDS (not recommended)

---

## 🚀 Example Configuration

**For AWS RDS:**
```env
DB_HOST=leadtime-lense-db.abc123.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=invmod
DB_SSL=true
PORT=3001
```

**For Local XAMPP:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=invmod
DB_SSL=false
PORT=3001
```

---

## ✅ Summary

1. **Update `server/.env`** with AWS RDS credentials
2. **Configure Security Group** to allow your IP
3. **Restart backend server** → Should connect successfully
4. **Your application will now use AWS database!** 🎉

The code is already set up - just change the connection details in `.env`!


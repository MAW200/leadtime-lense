# Leadtime Lense - Inventory Management System

A comprehensive inventory management system with material claims, returns, purchase orders, and project management features.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MySQL (via XAMPP or standalone)
- npm or yarn

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
```

### 2. Database Setup

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE leadtime_lense;
   ```

2. **Import Schema:**
   ```bash
   mysql -u root leadtime_lense < mysql_schema.sql
   ```
   
   Or use phpMyAdmin: Import `mysql_schema.sql` file

3. **Configure Backend:**
   Create `server/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=leadtime_lense
   PORT=3001
   ```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Access Application

- Frontend: `http://localhost:8080` (or port shown in terminal)
- Backend API: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`

## 📁 Project Structure

```
leadtime-lense/
├── src/                    # Frontend React application
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API client
│   └── contexts/         # React contexts
├── server/                # Backend Express API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── utils/        # Database helpers
│   │   └── config/       # Configuration files
│   └── scripts/          # Database scripts
├── docs/                  # Documentation
│   ├── setup/            # Setup guides
│   ├── migration/        # Migration guides
│   └── troubleshooting/  # Troubleshooting guides
└── mysql_schema.sql       # Database schema
```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- Tailwind CSS
- shadcn/ui

### Backend
- Node.js
- Express.js
- MySQL (mysql2)
- JWT (for future auth)

## 📚 Documentation

- **[Setup Guide](docs/setup/QUICK_START.md)** - Complete setup instructions
- **[Database Setup](docs/setup/CREATE_DATABASE.md)** - Database creation guide
- **[Troubleshooting](docs/troubleshooting/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Migration Guide](docs/migration/MYSQL_MIGRATION_GUIDE.md)** - Supabase to MySQL migration

## 🔑 Key Features

- **Inventory Management** - Track stock levels, vendors, and products
- **Material Claims** - Onsite team can claim materials for projects
- **Returns Management** - Handle damaged goods returns
- **Purchase Orders** - Create and track POs with QA inspection
- **Project Management** - Manage projects with BOM templates
- **Role-Based Access** - CEO Admin, Warehouse Admin, Onsite Team
- **Audit Logging** - Track all system actions

## 🗄️ Database

The application uses MySQL with the following key tables:
- `inventory_items` - Product inventory
- `projects` - Project/condo information
- `claims` - Material claims
- `returns` - Damaged goods returns
- `purchase_orders` - Purchase orders
- `project_materials` - Project BOM
- `notifications` - System notifications

See `mysql_schema.sql` for complete schema.

## 🐛 Troubleshooting

If you encounter issues:

1. **Backend not starting?** Check `docs/troubleshooting/TROUBLESHOOTING.md`
2. **Database errors?** Verify MySQL is running and credentials are correct
3. **CORS errors?** Ensure backend is running on port 3001
4. **Port conflicts?** Check `docs/troubleshooting/FIX_PORT_3001.md`

## 📝 Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (`server/.env`)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=leadtime_lense
PORT=3001
```

## 🚢 Deployment

### Backend
1. Set production environment variables
2. Build: `npm start` (production mode)
3. Use PM2 or similar process manager

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to static hosting

## 📄 License

Private project - All rights reserved

## 🤝 Support

For issues and questions, refer to the documentation in the `docs/` folder.

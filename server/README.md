# Leadtime Lense API Server

Express.js backend API for the Leadtime Lense Inventory Management System.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your MySQL database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=leadtime_lense

PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:5173
```

### 3. Create MySQL Database

Run the schema file to create all tables:

```bash
mysql -u your_username -p your_database < ../mysql_schema.sql
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get single inventory item
- `GET /api/inventory/:id/vendors` - Get vendors for a product

### Projects
- `GET /api/projects` - Get all projects (optional `?status=active`)
- `GET /api/projects/:id` - Get single project
- `GET /api/projects/:id/materials` - Get project BOM
- `POST /api/projects` - Create project (requires `ceo_admin`)
- `PUT /api/projects/:id` - Update project (requires `ceo_admin`)
- `DELETE /api/projects/:id` - Delete project (requires `ceo_admin`)

### Claims
- `GET /api/claims` - Get all claims (optional `?projectId=...&status=...`)
- `GET /api/claims/pending` - Get pending claims (requires `warehouse_admin`)
- `GET /api/claims/:id` - Get single claim
- `POST /api/claims` - Create claim (requires `onsite_team`)
- `POST /api/claims/:id/approve` - Approve claim (requires `warehouse_admin`)
- `POST /api/claims/:id/deny` - Deny claim (requires `warehouse_admin`)

### Returns
- `GET /api/returns` - Get all returns (optional `?status=...`)
- `GET /api/returns/pending` - Get pending returns (requires `warehouse_admin`)
- `POST /api/returns` - Create return (requires `onsite_team`)
- `POST /api/returns/:id/approve` - Approve return (requires `warehouse_admin`)
- `POST /api/returns/:id/reject` - Reject return (requires `warehouse_admin`)

### Stock Adjustments
- `GET /api/stock-adjustments` - Get all adjustments (optional filters)
- `POST /api/stock-adjustments` - Create adjustment (requires `warehouse_admin`)

### Notifications
- `GET /api/notifications` - Get notifications for user
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read

### Project Templates
- `GET /api/project-templates` - Get all templates
- `GET /api/project-templates/:id` - Get template with items
- `POST /api/project-templates` - Create template (requires `ceo_admin`)
- `PUT /api/project-templates/:id` - Update template (requires `ceo_admin`)
- `DELETE /api/project-templates/:id` - Delete template (requires `ceo_admin`)
- `POST /api/project-templates/:id/items` - Add item to template
- `PUT /api/project-templates/:id/items/:itemId` - Update template item
- `DELETE /api/project-templates/:id/items/:itemId` - Delete template item

## Authentication

Currently, authentication is handled via HTTP headers:
- `x-user-role`: User role (`ceo_admin`, `warehouse_admin`, `onsite_team`)
- `x-user-name`: User name

**Note**: In production, implement proper JWT authentication.

## Security

Since MySQL doesn't have Row Level Security (RLS), all security is handled at the application level via middleware. Each route checks user roles before allowing access.

## Health Check

```bash
curl http://localhost:3001/health
```

## Development

The server uses:
- **Express.js** - Web framework
- **mysql2** - MySQL client with connection pooling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Troubleshooting

### Database Connection Failed
- Check your `.env` file has correct credentials
- Ensure MySQL server is running
- Verify database exists: `mysql -u user -p -e "SHOW DATABASES;"`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3001

### CORS Errors
- Update `CORS_ORIGIN` in `.env` to match your frontend URL


import express from 'express';
import { query, update } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get notifications for user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'ceo_admin';
    const role = req.query.role || req.headers['x-user-role'] || 'ceo_admin';
    
    let sql = `
      SELECT * FROM notifications
      WHERE recipient_user_id = ? OR recipient_role = ?
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const notifications = await query(sql, [userId, role]);
    res.json(notifications || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

// Get unread count
router.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'ceo_admin';
    const role = req.query.role || req.headers['x-user-role'] || 'ceo_admin';
    
    const [result] = await query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE (recipient_user_id = ? OR recipient_role = ?) AND is_read = false
    `, [userId, role]);
    
    res.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Return 0 if table doesn't exist
    res.json({ count: 0 });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await update('notifications', req.params.id, { is_read: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', async (req, res, next) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    const role = req.body.role || req.headers['x-user-role'];
    
    await query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE (recipient_user_id = ? OR recipient_role = ?) AND is_read = false
    `, [userId, role]);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;


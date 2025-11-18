import express from 'express';
import { query, insert } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs with filters
router.get('/', async (req, res, next) => {
  try {
    const { actionType, userName, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (actionType && actionType !== 'all') {
      sql += ' AND action_type = ?';
      params.push(actionType);
    }
    
    if (userName) {
      sql += ' AND user_name LIKE ?';
      params.push(`%${userName}%`);
    }
    
    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT 100';
    
    const logs = await query(sql, params);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// Create audit log
router.post('/', requireRole('ceo_admin', 'warehouse_admin', 'onsite_team'), async (req, res, next) => {
  try {
    const logData = {
      id: generateUUID(),
      user_name: req.body.user_name,
      user_role: req.body.user_role,
      action_type: req.body.action_type,
      action_description: req.body.action_description,
      related_entity_type: req.body.related_entity_type || null,
      related_entity_id: req.body.related_entity_id || null,
      photo_url: req.body.photo_url || null,
      metadata: req.body.metadata ? JSON.stringify(req.body.metadata) : null,
    };
    
    const log = await insert('audit_logs', logData);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

export default router;


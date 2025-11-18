import express from 'express';
import { query, insert, update } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { callFunction } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all returns
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        r.*,
        p.name as project_name
      FROM returns r
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY r.created_at DESC';
    
    const returns = await query(sql, params);
    
    // Fetch return items
    for (const returnItem of returns) {
      const items = await query(`
        SELECT 
          ri.*,
          ii.product_name,
          ii.sku
        FROM return_items ri
        JOIN inventory_items ii ON ri.product_id = ii.id
        WHERE ri.return_id = ?
      `, [returnItem.id]);
      returnItem.return_items = items;
    }
    
    res.json(returns);
  } catch (error) {
    next(error);
  }
});

// Get pending returns - Allow all roles for now
router.get('/pending', async (req, res, next) => {
  try {
    const returns = await query(`
      SELECT 
        r.*,
        p.name as project_name
      FROM returns r
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `);
    
    // Fetch return items
    for (const returnItem of returns) {
      const items = await query(`
        SELECT 
          ri.*,
          ii.product_name,
          ii.sku
        FROM return_items ri
        JOIN inventory_items ii ON ri.product_id = ii.id
        WHERE ri.return_id = ?
      `, [returnItem.id]);
      returnItem.return_items = items;
    }
    
    res.json(returns);
  } catch (error) {
    next(error);
  }
});

// Create return
router.post('/', requireRole('onsite_team', 'ceo_admin'), async (req, res, next) => {
  try {
    const returnNumber = await callFunction('generate_return_number');
    
    const returnData = {
      id: generateUUID(),
      return_number: returnNumber,
      project_id: req.body.projectId,
      claim_id: req.body.claimId || null,
      onsite_user_id: req.body.onsiteUserId,
      onsite_user_name: req.body.onsiteUserName,
      status: 'pending',
      reason: req.body.reason,
      photo_url: req.body.photoUrl,
      notes: req.body.notes || null,
    };
    
    const returnRecord = await insert('returns', returnData);
    
    // Insert return items
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        await insert('return_items', {
          id: generateUUID(),
          return_id: returnRecord.id,
          product_id: item.productId,
          quantity: item.quantity,
        });
      }
    }
    
    // Create notification
    await insert('notifications', {
      id: generateUUID(),
      recipient_user_id: 'warehouse_admin',
      recipient_role: 'warehouse_admin',
      message: `Return ${returnNumber} submitted by ${req.body.onsiteUserName}.`,
      notification_type: 'return_pending_review',
      related_return_id: returnRecord.id,
      is_read: false,
    });
    
    res.status(201).json(returnRecord);
  } catch (error) {
    next(error);
  }
});

// Approve return
router.post('/:id/approve', requireRole('warehouse_admin', 'ceo_admin'), async (req, res, next) => {
  try {
    await update('returns', req.params.id, {
      status: 'approved',
      warehouse_admin_name: req.userName,
      processed_at: new Date(),
    });
    
    // Decrease project_materials claimed_quantity (don't increase inventory - damaged goods)
    const returnRecord = await query('SELECT * FROM returns WHERE id = ?', [req.params.id]);
    const items = await query('SELECT * FROM return_items WHERE return_id = ?', [req.params.id]);
    
    for (const item of items) {
      await query(`
        UPDATE project_materials 
        SET claimed_quantity = GREATEST(claimed_quantity - ?, 0)
        WHERE project_id = ? AND product_id = ?
      `, [item.quantity, returnRecord[0].project_id, item.product_id]);
    }
    
    // Create audit log
    await insert('audit_logs', {
      id: generateUUID(),
      user_name: req.userName,
      user_role: req.userRole,
      action_type: 'return_approved',
      action_description: `Return ${returnRecord[0].return_number} approved`,
      related_entity_type: 'return',
      related_entity_id: req.params.id,
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Reject return
router.post('/:id/reject', requireRole('warehouse_admin', 'ceo_admin'), async (req, res, next) => {
  try {
    const { rejectReason, rejectNotes } = req.body;
    
    await update('returns', req.params.id, {
      status: 'rejected',
      warehouse_admin_name: req.userName,
      processed_at: new Date(),
    });
    
    const returnRecord = await query('SELECT * FROM returns WHERE id = ?', [req.params.id]);
    
    // Create audit log
    await insert('audit_logs', {
      id: generateUUID(),
      user_name: req.userName,
      user_role: req.userRole,
      action_type: 'return_rejected',
      action_description: `Return ${returnRecord[0].return_number} rejected: ${rejectReason}`,
      related_entity_type: 'return',
      related_entity_id: req.params.id,
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;


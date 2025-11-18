import express from 'express';
import { query, insert, update, transaction } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { callFunction } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all claims (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    let sql = `
      SELECT 
        c.*,
        p.name as project_name,
        p.location as project_location
      FROM claims c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (projectId) {
      sql += ' AND c.project_id = ?';
      params.push(projectId);
    }
    
    if (status && status !== 'all') {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY c.created_at DESC';
    
    const claims = await query(sql, params);
    
    // Fetch claim items for each claim
    for (const claim of claims) {
      const items = await query(`
        SELECT 
          ci.*,
          ii.product_name,
          ii.sku,
          ii.in_stock
        FROM claim_items ci
        JOIN inventory_items ii ON ci.product_id = ii.id
        WHERE ci.claim_id = ?
      `, [claim.id]);
      claim.claim_items = items;
    }
    
    res.json(claims);
  } catch (error) {
    next(error);
  }
});

// Get pending claims (for warehouse admin) - Allow all roles for now
router.get('/pending', async (req, res, next) => {
  try {
    const claims = await query(`
      SELECT 
        c.*,
        p.name as project_name
      FROM claims c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.status = 'pending'
      ORDER BY 
        CASE WHEN c.claim_type = 'emergency' THEN 0 ELSE 1 END,
        c.created_at ASC
    `);
    
    // Fetch claim items
    for (const claim of claims) {
      const items = await query(`
        SELECT 
          ci.*,
          ii.product_name,
          ii.sku,
          ii.in_stock
        FROM claim_items ci
        JOIN inventory_items ii ON ci.product_id = ii.id
        WHERE ci.claim_id = ?
      `, [claim.id]);
      claim.claim_items = items;
    }
    
    res.json(claims);
  } catch (error) {
    next(error);
  }
});

// Get single claim
router.get('/:id', async (req, res, next) => {
  try {
    const [claim] = await query(`
      SELECT 
        c.*,
        p.name as project_name,
        p.location as project_location
      FROM claims c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    // Fetch claim items
    const items = await query(`
      SELECT 
        ci.*,
        ii.product_name,
        ii.sku,
        ii.in_stock
      FROM claim_items ci
      JOIN inventory_items ii ON ci.product_id = ii.id
      WHERE ci.claim_id = ?
    `, [claim.id]);
    
    claim.claim_items = items;
    res.json(claim);
  } catch (error) {
    next(error);
  }
});

// Create claim
router.post('/', requireRole('onsite_team', 'ceo_admin'), async (req, res, next) => {
  try {
    const claimNumber = await callFunction('generate_claim_number');
    
    const claimData = {
      id: generateUUID(),
      claim_number: claimNumber,
      project_id: req.body.projectId,
      onsite_user_id: req.body.onsiteUserId,
      onsite_user_name: req.body.onsiteUserName,
      photo_url: req.body.photoUrl,
      notes: req.body.notes || null,
      status: 'pending',
      claim_type: req.body.claimType || 'standard',
      emergency_reason: req.body.emergencyReason || null,
    };
    
    const claim = await insert('claims', claimData);
    
    // Insert claim items
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        await insert('claim_items', {
          id: generateUUID(),
          claim_id: claim.id,
          product_id: item.productId,
          quantity_requested: item.quantity,
          quantity_approved: 0,
        });
      }
    }
    
    // Create notifications
    await insert('notifications', {
      id: generateUUID(),
      recipient_user_id: req.body.onsiteUserId,
      recipient_role: 'onsite_team',
      message: `Claim ${claimNumber} submitted and awaiting review.`,
      notification_type: req.body.claimType === 'emergency' ? 'emergency_claim_submitted' : 'claim_submitted',
      related_claim_id: claim.id,
      is_read: false,
    });
    
    if (req.body.claimType === 'emergency') {
      await insert('notifications', {
        id: generateUUID(),
        recipient_user_id: 'ceo_admin',
        recipient_role: 'ceo_admin',
        message: `Emergency claim ${claimNumber} requires immediate attention.`,
        notification_type: 'emergency_claim_alert',
        related_claim_id: claim.id,
        is_read: false,
      });
    } else {
      await insert('notifications', {
        id: generateUUID(),
        recipient_user_id: 'warehouse_admin',
        recipient_role: 'warehouse_admin',
        message: `New claim ${claimNumber} submitted by ${req.body.onsiteUserName}.`,
        notification_type: 'claim_pending_review',
        related_claim_id: claim.id,
        is_read: false,
      });
    }
    
    // Fetch complete claim with items
    const [completeClaim] = await query('SELECT * FROM claims WHERE id = ?', [claim.id]);
    const items = await query('SELECT * FROM claim_items WHERE claim_id = ?', [claim.id]);
    completeClaim.claim_items = items;
    
    res.status(201).json(completeClaim);
  } catch (error) {
    next(error);
  }
});

// Approve claim (with partial approval support)
router.post('/:id/approve', requireRole('warehouse_admin', 'ceo_admin'), async (req, res, next) => {
  try {
    await transaction(async (connection) => {
      const { approvalQuantities } = req.body;
      const claimId = req.params.id;
      
      // Get claim
      const [claim] = await connection.execute('SELECT * FROM claims WHERE id = ?', [claimId]);
      if (!claim[0]) {
        throw new Error('Claim not found');
      }
      
      let allApproved = true;
      let anyApproved = false;
      
      // Update claim items and inventory
      for (const [itemId, approvedQty] of Object.entries(approvalQuantities)) {
        const [item] = await connection.execute('SELECT * FROM claim_items WHERE id = ?', [itemId]);
        if (!item[0]) continue;
        
        const requestedQty = item[0].quantity_requested;
        const approved = parseInt(approvedQty) || 0;
        
        if (approved > 0) {
          anyApproved = true;
          
          // Update claim item
          await connection.execute(
            'UPDATE claim_items SET quantity_approved = ? WHERE id = ?',
            [approved, itemId]
          );
          
          // Update inventory stock
          await connection.execute(
            'UPDATE inventory_items SET in_stock = in_stock - ? WHERE id = ?',
            [approved, item[0].product_id]
          );
          
          // Update project materials claimed quantity
          await connection.execute(`
            UPDATE project_materials 
            SET claimed_quantity = claimed_quantity + ? 
            WHERE project_id = ? AND product_id = ?
          `, [approved, claim[0].project_id, item[0].product_id]);
        }
        
        if (approved < requestedQty) {
          allApproved = false;
        }
      }
      
      // Update claim status
      const newStatus = allApproved ? 'approved' : 'partial_approved';
      await connection.execute(
        'UPDATE claims SET status = ?, warehouse_admin_name = ?, processed_at = NOW() WHERE id = ?',
        [newStatus, req.userName, claimId]
      );
      
      // Create audit log
      await connection.execute(`
        INSERT INTO audit_logs (id, user_name, user_role, action_type, action_description, related_entity_type, related_entity_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        generateUUID(),
        req.userName,
        req.userRole,
        newStatus === 'approved' ? 'claim_approved' : 'claim_partially_approved',
        `Claim ${claim[0].claim_number} ${newStatus === 'approved' ? 'approved' : 'partially approved'}`,
        'claim',
        claimId,
      ]);
      
      // Create notification
      await connection.execute(`
        INSERT INTO notifications (id, recipient_user_id, recipient_role, message, notification_type, related_claim_id, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        generateUUID(),
        claim[0].onsite_user_id,
        'onsite_team',
        `Claim ${claim[0].claim_number} has been ${newStatus === 'approved' ? 'approved' : 'partially approved'}.`,
        newStatus === 'approved' ? 'claim_approved' : 'claim_partially_approved',
        claimId,
        false,
      ]);
    });
    
    // Fetch updated claim
    const [claim] = await query('SELECT * FROM claims WHERE id = ?', [req.params.id]);
    const items = await query('SELECT * FROM claim_items WHERE claim_id = ?', [req.params.id]);
    claim[0].claim_items = items;
    
    res.json(claim[0]);
  } catch (error) {
    next(error);
  }
});

// Deny claim
router.post('/:id/deny', requireRole('warehouse_admin', 'ceo_admin'), async (req, res, next) => {
  try {
    const { denialReason, denialNotes } = req.body;
    
    await update('claims', req.params.id, {
      status: 'denied',
      denial_reason: denialReason,
      notes: denialNotes || null,
      warehouse_admin_name: req.userName,
      processed_at: new Date(),
    });
    
    // Create audit log
    const [claim] = await query('SELECT * FROM claims WHERE id = ?', [req.params.id]);
    await insert('audit_logs', {
      id: generateUUID(),
      user_name: req.userName,
      user_role: req.userRole,
      action_type: 'claim_denied',
      action_description: `Claim ${claim[0].claim_number} denied: ${denialReason}`,
      related_entity_type: 'claim',
      related_entity_id: req.params.id,
    });
    
    // Create notification
    await insert('notifications', {
      id: generateUUID(),
      recipient_user_id: claim[0].onsite_user_id,
      recipient_role: 'onsite_team',
      message: `Claim ${claim[0].claim_number} has been denied: ${denialReason}`,
      notification_type: 'claim_denied',
      related_claim_id: req.params.id,
      is_read: false,
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;


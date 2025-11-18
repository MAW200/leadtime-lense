import express from 'express';
import { query, insert } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { callFunction } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all stock adjustments
router.get('/', async (req, res, next) => {
  try {
    const { reason, startDate, endDate } = req.query;
    let sql = `
      SELECT 
        sa.*,
        ii.product_name,
        ii.sku
      FROM stock_adjustments sa
      JOIN inventory_items ii ON sa.product_id = ii.id
      WHERE 1=1
    `;
    const params = [];
    
    if (reason && reason !== 'all') {
      sql += ' AND sa.reason = ?';
      params.push(reason);
    }
    
    if (startDate) {
      sql += ' AND sa.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND sa.created_at <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY sa.created_at DESC';
    
    const adjustments = await query(sql, params);
    res.json(adjustments);
  } catch (error) {
    next(error);
  }
});

// Create stock adjustment
router.post('/', requireRole('warehouse_admin', 'ceo_admin'), async (req, res, next) => {
  try {
    const adjustmentNumber = await callFunction('generate_adjustment_number');
    
    // Get current stock
    const [product] = await query('SELECT in_stock FROM inventory_items WHERE id = ?', [req.body.productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const previousStock = product.in_stock;
    const quantityChange = req.body.quantityChange;
    const newStock = previousStock + quantityChange;
    
    // Update inventory
    await query('UPDATE inventory_items SET in_stock = ? WHERE id = ?', [newStock, req.body.productId]);
    
    // Create adjustment record
    const adjustment = await insert('stock_adjustments', {
      id: generateUUID(),
      adjustment_number: adjustmentNumber,
      product_id: req.body.productId,
      quantity_change: quantityChange,
      reason: req.body.reason,
      notes: req.body.notes || null,
      previous_stock: previousStock,
      new_stock: newStock,
      admin_id: req.body.adminId || req.userName,
      admin_name: req.userName,
    });
    
    // Create audit log
    await insert('audit_logs', {
      id: generateUUID(),
      user_name: req.userName,
      user_role: req.userRole,
      action_type: 'stock_adjustment_created',
      action_description: `Stock adjustment ${adjustmentNumber}: ${quantityChange > 0 ? '+' : ''}${quantityChange} (${previousStock} → ${newStock})`,
      related_entity_type: 'stock_adjustment',
      related_entity_id: adjustment.id,
    });
    
    res.status(201).json(adjustment);
  } catch (error) {
    next(error);
  }
});

export default router;


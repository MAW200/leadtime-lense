import express from 'express';
import { query, insert, update } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { callFunction } from '../utils/db-helpers.js';

const router = express.Router();

// Get all purchase orders
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        po.*,
        v.name as vendor_name,
        v.contact_email,
        v.contact_phone
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      sql += ' AND po.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY po.created_at DESC';
    
    const orders = await query(sql, params);
    
    // Fetch order items
    for (const order of orders) {
      const items = await query(`
        SELECT 
          poi.*,
          ii.product_name,
          ii.sku
        FROM purchase_order_items poi
        JOIN inventory_items ii ON poi.product_id = ii.id
        WHERE poi.po_id = ?
      `, [order.id]);
      order.purchase_order_items = items;
    }
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get single purchase order
router.get('/:id', async (req, res, next) => {
  try {
    const [order] = await query(`
      SELECT 
        po.*,
        v.name as vendor_name,
        v.contact_email,
        v.contact_phone
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE po.id = ?
    `, [req.params.id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const items = await query(`
      SELECT 
        poi.*,
        ii.product_name,
        ii.sku
      FROM purchase_order_items poi
      JOIN inventory_items ii ON poi.product_id = ii.id
      WHERE poi.po_id = ?
    `, [order.id]);
    
    order.purchase_order_items = items;
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Create purchase order
router.post('/', async (req, res, next) => {
  try {
    const poNumber = await callFunction('generate_po_number');
    
    const poData = {
      id: generateUUID(),
      po_number: poNumber,
      vendor_id: req.body.vendor_id,
      status: req.body.status || 'draft',
      total_amount: req.body.total_amount || 0,
      order_date: req.body.order_date || null,
      expected_delivery_date: req.body.expected_delivery_date || null,
      notes: req.body.notes || null,
      created_by: req.body.created_by || null,
    };
    
    const order = await insert('purchase_orders', poData);
    
    // Insert order items
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        await insert('purchase_order_items', {
          id: generateUUID(),
          po_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });
      }
    }
    
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// Update purchase order
router.put('/:id', async (req, res, next) => {
  try {
    const order = await update('purchase_orders', req.params.id, req.body);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;


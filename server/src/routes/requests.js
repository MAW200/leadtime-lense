import express from 'express';
import { query, insert, update } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { callFunction } from '../utils/db-helpers.js';

const router = express.Router();

// Get all requests
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        ir.*,
        p.name as project_name,
        p.location as project_location
      FROM internal_requests ir
      LEFT JOIN projects p ON ir.project_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      sql += ' AND ir.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY ir.created_at DESC';
    
    const requests = await query(sql, params);
    
    // Fetch request items (handle case where table might not exist)
    for (const request of requests) {
      try {
        const items = await query(`
          SELECT 
            ri.*,
            ii.product_name,
            ii.sku
          FROM request_items ri
          JOIN inventory_items ii ON ri.product_id = ii.id
          WHERE ri.request_id = ?
        `, [request.id]);
        request.request_items = items || [];
      } catch (itemError) {
        console.error('Error fetching request items:', itemError);
        request.request_items = [];
      }
    }
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    // Return empty array instead of crashing
    res.json([]);
  }
});

// Get single request
router.get('/:id', async (req, res, next) => {
  try {
    const [request] = await query(`
      SELECT 
        ir.*,
        p.name as project_name
      FROM internal_requests ir
      LEFT JOIN projects p ON ir.project_id = p.id
      WHERE ir.id = ?
    `, [req.params.id]);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const items = await query(`
      SELECT 
        ri.*,
        ii.product_name,
        ii.sku
      FROM request_items ri
      JOIN inventory_items ii ON ri.product_id = ii.id
      WHERE ri.request_id = ?
    `, [request.id]);
    
    request.request_items = items;
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Create request
router.post('/', async (req, res, next) => {
  try {
    const requestNumber = await callFunction('generate_request_number');
    
    const requestData = {
      id: generateUUID(),
      request_number: requestNumber,
      requester_name: req.body.requester_name,
      requester_email: req.body.requester_email || null,
      destination_property: req.body.destination_property,
      notes: req.body.notes || null,
      project_id: req.body.project_id || null,
      photo_url: req.body.photo_url || null,
      created_by_role: req.body.created_by_role || 'admin',
      status: 'pending',
    };
    
    const request = await insert('internal_requests', requestData);
    
    // Insert request items
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        await insert('request_items', {
          id: generateUUID(),
          request_id: request.id,
          product_id: item.product_id,
          quantity_requested: item.quantity_requested,
          quantity_fulfilled: 0,
        });
      }
    }
    
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// Update request status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, fulfilledDate } = req.body;
    const updateData = { status };
    if (fulfilledDate) updateData.fulfilled_date = fulfilledDate;
    
    const request = await update('internal_requests', req.params.id, updateData);
    res.json(request);
  } catch (error) {
    next(error);
  }
});

export default router;


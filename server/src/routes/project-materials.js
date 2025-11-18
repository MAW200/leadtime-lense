import express from 'express';
import { query, insert } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';

const router = express.Router();

// Get project materials
router.get('/:projectId', async (req, res, next) => {
  try {
    const materials = await query(`
      SELECT 
        pm.*,
        ii.product_name,
        ii.sku,
        ii.in_stock
      FROM project_materials pm
      JOIN inventory_items ii ON pm.product_id = ii.id
      WHERE pm.project_id = ?
      ORDER BY pm.phase, ii.product_name
    `, [req.params.projectId]);
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

// Create project material
router.post('/', async (req, res, next) => {
  try {
    const materialData = {
      id: generateUUID(),
      project_id: req.body.projectId,
      product_id: req.body.productId,
      phase: req.body.phase,
      required_quantity: req.body.requiredQuantity,
      claimed_quantity: 0,
    };
    
    const material = await insert('project_materials', materialData);
    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
});

export default router;


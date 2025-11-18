import express from 'express';
import { query } from '../utils/db-helpers.js';

const router = express.Router();

// Get all vendors
router.get('/', async (req, res, next) => {
  try {
    const vendors = await query('SELECT * FROM vendors ORDER BY name ASC');
    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

// Get vendor products
router.get('/:id/products', async (req, res, next) => {
  try {
    const products = await query(`
      SELECT 
        pv.*,
        ii.*
      FROM product_vendors pv
      JOIN inventory_items ii ON pv.product_id = ii.id
      WHERE pv.vendor_id = ?
      ORDER BY ii.product_name
    `, [req.params.id]);
    res.json(products.map(p => p.product_id ? { ...p, id: p.product_id } : null).filter(Boolean));
  } catch (error) {
    next(error);
  }
});

export default router;


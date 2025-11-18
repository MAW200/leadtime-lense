import express from 'express';
import { query } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res, next) => {
  try {
    const items = await query('SELECT * FROM inventory_items ORDER BY product_name ASC');
    res.json(items || []);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

// Get single inventory item
router.get('/:id', async (req, res, next) => {
  try {
    const [item] = await query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Get inventory items with vendor information
router.get('/:id/vendors', async (req, res, next) => {
  try {
    const vendors = await query(`
      SELECT 
        pv.*,
        v.name as vendor_name,
        v.contact_email,
        v.contact_phone,
        v.country
      FROM product_vendors pv
      JOIN vendors v ON pv.vendor_id = v.id
      WHERE pv.product_id = ?
      ORDER BY pv.is_primary DESC
    `, [req.params.id]);
    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

export default router;


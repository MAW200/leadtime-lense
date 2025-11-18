import express from 'express';
import { query, insert, update, remove } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await query('SELECT * FROM project_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get single template with items
router.get('/:id', async (req, res, next) => {
  try {
    const [template] = await query('SELECT * FROM project_templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const items = await query(`
      SELECT 
        pti.*,
        ii.product_name,
        ii.sku
      FROM project_template_items pti
      JOIN inventory_items ii ON pti.product_id = ii.id
      WHERE pti.template_id = ?
      ORDER BY pti.phase, ii.product_name
    `, [req.params.id]);
    
    template.project_template_items = items;
    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Create template
router.post('/', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    const templateData = {
      id: generateUUID(),
      name: req.body.name,
      description: req.body.description || null,
      is_active: req.body.isActive !== false,
    };
    
    const template = await insert('project_templates', templateData);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Update template
router.put('/:id', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      is_active: req.body.isActive,
    };
    
    const template = await update('project_templates', req.params.id, updateData);
    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Delete template
router.delete('/:id', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    await remove('project_templates', req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Add item to template
router.post('/:id/items', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    const itemData = {
      id: generateUUID(),
      template_id: req.params.id,
      product_id: req.body.productId,
      phase: req.body.phase,
      required_quantity: req.body.requiredQuantity,
    };
    
    const item = await insert('project_template_items', itemData);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Update template item
router.put('/:id/items/:itemId', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    const updateData = {
      required_quantity: req.body.requiredQuantity,
    };
    
    const item = await update('project_template_items', req.params.itemId, updateData);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Delete template item
router.delete('/:id/items/:itemId', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    await remove('project_template_items', req.params.itemId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;


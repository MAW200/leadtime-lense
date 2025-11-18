import express from 'express';
import { query, insert, update, remove } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status;
    let sql = 'SELECT * FROM projects';
    const params = [];
    
    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    const projects = await query(sql, params);
    res.json(projects || []);
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

// Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const [project] = await query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Get project materials (BOM)
router.get('/:id/materials', async (req, res, next) => {
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
    `, [req.params.id]);
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

// Create project
router.post('/', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    const projectData = {
      id: generateUUID(),
      name: req.body.name,
      location: req.body.location || null,
      status: req.body.status || 'active',
      description: req.body.description || null,
    };
    
    const project = await insert('projects', projectData);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    const updateData = {
      name: req.body.name,
      location: req.body.location,
      status: req.body.status,
      description: req.body.description,
    };
    
    const project = await update('projects', req.params.id, updateData);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', requireRole('ceo_admin'), async (req, res, next) => {
  try {
    await remove('projects', req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;


import express from 'express';
import { query, insert } from '../utils/db-helpers.js';
import { generateUUID } from '../utils/db-helpers.js';

const router = express.Router();

// Get user projects
router.get('/:userId', async (req, res, next) => {
  try {
    const userProjects = await query(`
      SELECT 
        up.*,
        p.name as project_name,
        p.location,
        p.status,
        p.description
      FROM user_projects up
      JOIN projects p ON up.project_id = p.id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
    `, [req.params.userId]);
    res.json(userProjects);
  } catch (error) {
    next(error);
  }
});

// Assign user to project
router.post('/', async (req, res, next) => {
  try {
    const assignmentData = {
      id: generateUUID(),
      user_id: req.body.userId,
      project_id: req.body.projectId,
    };
    
    const assignment = await insert('user_projects', assignmentData);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
});

export default router;


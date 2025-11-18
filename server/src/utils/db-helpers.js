import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

/**
 * Generate UUID for database records
 */
export const generateUUID = () => uuidv4();

/**
 * Execute a SELECT query and return results
 */
export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Execute an INSERT query and return the inserted row
 */
export const insert = async (table, data) => {
  try {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    
    // Fetch and return the inserted row (use data.id if provided, otherwise result.insertId)
    const insertedId = data.id || result.insertId;
    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [insertedId]);
    return rows[0];
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
};

/**
 * Execute an UPDATE query and return the updated row
 */
export const update = async (table, id, data) => {
  try {
    const columns = Object.keys(data).map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const sql = `UPDATE ${table} SET ${columns} WHERE id = ?`;
    await pool.execute(sql, values);
    
    // Fetch and return the updated row
    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return rows[0];
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
};

/**
 * Execute a DELETE query
 */
export const remove = async (table, id) => {
  try {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
};

/**
 * Call a stored function
 * MySQL functions need to be called with CALL or SELECT
 */
export const callFunction = async (functionName, ...args) => {
  try {
    // For MySQL stored functions, use SELECT function_name() syntax
    // But first check if it's a stored procedure (CALL) or function (SELECT)
    const placeholders = args.map(() => '?').join(', ');
    
    // Try SELECT first (for functions)
    try {
      const sql = `SELECT ${functionName}(${placeholders}) AS result`;
      const [rows] = await pool.execute(sql, args);
      return rows[0]?.result;
    } catch (selectError) {
      // If SELECT fails, try CALL (for procedures)
      const sql = `CALL ${functionName}(${placeholders})`;
      const [rows] = await pool.execute(sql, args);
      return rows[0]?.[0]?.result || rows[0]?.[0];
    }
  } catch (error) {
    console.error(`Function call error for ${functionName}:`, error);
    // Fallback: Generate number manually if function doesn't exist
    if (functionName.includes('number')) {
      const prefix = functionName.includes('claim') ? 'CLM' : 
                     functionName.includes('return') ? 'RET' :
                     functionName.includes('adjustment') ? 'ADJ' :
                     functionName.includes('request') ? 'REQ' :
                     functionName.includes('po') ? 'PO' : 'NUM';
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `${prefix}-${year}-${random}`;
    }
    throw error;
  }
};

/**
 * Execute a transaction
 */
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


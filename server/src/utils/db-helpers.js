import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/database.js';

/**
 * Generate UUID for database records
 */
export const generateUUID = () => uuidv4();

/**
 * Execute a SELECT query and return results
 * Supports simple SELECT queries with WHERE clauses using ? placeholders
 * For complex queries with JOINs, attempts to use Supabase query builder with relationships
 */
export const query = async (sql, params = []) => {
  try {
    // Check for JOIN queries - these need special handling
    const hasJoin = /JOIN/i.test(sql);
    
    if (hasJoin) {
      // For JOIN queries, try to convert to Supabase relationship syntax
      // Example: FROM product_vendors pv JOIN vendors v ON pv.vendor_id = v.id
      // Becomes: supabase.from('product_vendors').select('*, vendors(*)')
      
      const joinMatch = sql.match(/FROM\s+(\w+)\s+\w+\s+JOIN\s+(\w+)\s+\w+\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
      if (joinMatch) {
        const [, mainTable, joinTable, , , , ] = joinMatch;
        const whereMatch = sql.match(/WHERE\s+(\w+)\.(\w+)\s*=\s*\?/i);
        const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\.(\w+)(?:\s+(ASC|DESC))?/i);
        
        // Build Supabase query with relationship
        let supabaseQuery = supabase
          .from(mainTable)
          .select(`*, ${joinTable}(*)`);
        
        if (whereMatch && params.length > 0) {
          const [, , whereColumn] = whereMatch;
          supabaseQuery = supabaseQuery.eq(whereColumn, params[0]);
        }
        
        if (orderMatch) {
          const [, , orderColumn] = orderMatch;
          const direction = (orderMatch[3] || 'ASC').toLowerCase();
          supabaseQuery = supabaseQuery.order(orderColumn, { ascending: direction === 'asc' });
        }
        
        const { data, error } = await supabaseQuery;
        if (error) {
          // If relationship query fails, try without relationship
          console.warn('JOIN query failed, attempting simple query:', error.message);
          throw error;
        }
        return data || [];
      }
      
      // If JOIN pattern doesn't match, fall back to error
      throw new Error('Complex JOIN query not supported. Please use Supabase query builder directly.');
    }
    
    // Simple SELECT queries without JOINs
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/i);
    
    if (selectMatch) {
      const [, selectFields, table, whereClause, orderBy] = selectMatch;
      
      let supabaseQuery = supabase.from(table).select(selectFields === '*' ? '*' : selectFields);
      
      // Handle WHERE clause with ? placeholders
      if (whereClause && params.length > 0) {
        // Simple WHERE id = ? pattern
        const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
        if (whereMatch) {
          const column = whereMatch[1];
          supabaseQuery = supabaseQuery.eq(column, params[0]);
        } else {
          throw new Error('Complex WHERE clause not supported. Please use Supabase query builder directly.');
        }
      }
      
      // Handle ORDER BY
      if (orderBy) {
        const orderMatch = orderBy.match(/(\w+)(?:\s+(ASC|DESC))?/i);
        if (orderMatch) {
          const column = orderMatch[1];
          const direction = (orderMatch[2] || 'ASC').toLowerCase();
          supabaseQuery = supabaseQuery.order(column, { ascending: direction === 'asc' });
        }
      }
      
      const { data, error } = await supabaseQuery;
      if (error) throw error;
      return data || [];
    }
    
    // If query doesn't match patterns, throw error
    throw new Error('Query format not supported. Please use Supabase query builder directly.');
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
    const { data: inserted, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return inserted;
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
    const { data: updated, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updated;
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
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
};

/**
 * Call a stored function
 * Supabase uses RPC to call database functions
 */
export const callFunction = async (functionName, ...args) => {
  try {
    // Use Supabase RPC to call the function
    const { data, error } = await supabase.rpc(functionName, args.length > 0 ? { args } : {});
    
    if (error) {
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
    
    return data;
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
 * Note: Supabase doesn't support traditional transactions in the same way as MySQL
 * For complex transactions, consider using Supabase RPC functions or PostgREST transactions
 * This is a simplified version that executes the callback
 */
export const transaction = async (callback) => {
  try {
    // Supabase transactions are handled differently
    // For now, we'll just execute the callback
    // For proper transaction support, you may need to use Supabase RPC functions
    const result = await callback(supabase);
    return result;
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
};


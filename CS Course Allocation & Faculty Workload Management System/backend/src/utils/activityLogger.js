const { supabaseAdmin } = require('../config/supabase');

/**
 * Activity Logger Utility
 * Records system actions into the `activity_logs` table for compliance and audit trail.
 *
 * @param {Object} params
 * @param {string} params.userId - UUID of the user performing the action (Who)
 * @param {string} params.actionType - Action descriptor e.g. 'ALLOCATION_CREATED', 'STATUS_UPDATED', 'CONFLICT_RESOLVED' (What)
 * @param {string} params.entityName - Target table name e.g. 'course_allocations', 'faculty'
 * @param {string} params.entityId - UUID of the modified record
 * @param {Object} [params.oldValues] - Previous snapshot/state (Previous Value)
 * @param {Object} [params.newValues] - Updated snapshot/state (New Value)
 * @param {Object} [params.req] - Express request object for IP & User-Agent extraction
 */
const logActivity = async ({
  userId,
  actionType,
  entityName,
  entityId = null,
  oldValues = null,
  newValues = null,
  req = null,
}) => {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress =
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
      userAgent = req.headers['user-agent'] || null;
    }

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        action_type: actionType,
        entity_name: entityName,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress ? String(ipAddress).substring(0, 50) : null,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[ActivityLogger Error]: Failed to write to activity_logs table:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[ActivityLogger Exception]:', err.message);
    return null; // Non-blocking logging failure to avoid breaking primary transaction
  }
};

module.exports = {
  logActivity,
};

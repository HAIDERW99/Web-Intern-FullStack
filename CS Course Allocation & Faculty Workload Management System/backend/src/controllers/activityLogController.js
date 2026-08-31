const { supabaseAdmin } = require('../config/supabase');
const { paginatedResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Activity Log Controller (Audit Trail)
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { entity_name, action_type, user_id, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let countQuery = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    let dataQuery = supabaseAdmin
      .from('activity_logs')
      .select(`
        *,
        users:user_id (
          email,
          profiles (full_name, system_role)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (entity_name) {
      countQuery = countQuery.eq('entity_name', entity_name);
      dataQuery = dataQuery.eq('entity_name', entity_name);
    }
    if (action_type) {
      countQuery = countQuery.eq('action_type', action_type);
      dataQuery = dataQuery.eq('action_type', action_type);
    }
    if (user_id) {
      countQuery = countQuery.eq('user_id', user_id);
      dataQuery = dataQuery.eq('user_id', user_id);
    }

    const [{ count, error: countErr }, { data, error: dataErr }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countErr || dataErr) {
      return errorResponse(res, 'Failed to fetch activity logs', null, 500);
    }

    return paginatedResponse(res, 'Activity audit logs retrieved', data, {
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActivityLogs,
};

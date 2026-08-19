const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches `req.user` and `req.userRole` on success.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  // Use anon client to verify the user token
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

/**
 * Role guard — use after `authenticate`.
 * Usage: requireRole('admin') or requireRole(['admin', 'hotel_owner'])
 */
const requireRole = (roles) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async (req, res, next) => {
    const serviceSupabase = require('../config/supabase');
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    const userRole = profile?.role || req.user.user_metadata?.role || 'customer';

    if (!allowed.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.userRole = userRole;
    next();
  };
};

module.exports = { authenticate, requireRole };

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Anon client — used for auth operations (sign up / sign in)
const getAnonClient = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * POST /api/auth/register
 * Body: { email, password, full_name, phone?, role }
 * role must be 'customer' or 'hotel_owner' (admin is created manually)
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role = 'customer' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password and full_name are required' });
    }

    if (!['customer', 'hotel_owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be customer or hotel_owner' });
    }

    const supabase = getAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const supabase = getAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(401).json({ error: error.message });

    const serviceSupabase = require('../config/supabase');
    let { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      profile = {
        role: data.user.user_metadata?.role || 'customer',
        full_name: data.user.user_metadata?.full_name || 'User',
        phone: data.user.user_metadata?.phone || null,
      };
      await serviceSupabase.from('profiles').upsert({ id: data.user.id, ...profile });
    }

    res.status(200).json({
      session: data.session,
      user: { ...data.user, profile },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Requires Authorization: Bearer <access_token>
 */
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).json({ error: 'No token provided' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const supabase = getAnonClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Always return 200 to avoid email enumeration
    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

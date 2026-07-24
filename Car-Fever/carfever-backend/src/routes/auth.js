/**
 * Auth Routes — CarFever credential & Google OAuth auth using Supabase
 */

const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const supabase = require('../config/supabase')

// Helper to create a request-scoped Supabase client to prevent auth session pollution
const getAuthClient = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  auth: { persistSession: false }
})

// ─── Helpers ──────────────────────────────────────────────────────────────
const hashPwd = (pw) =>
  crypto.createHash('sha256').update(pw + 'cf_salt_2026').digest('hex')

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, phone?, company_name, password }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, phone = null, company_name, password } = req.body

  if (!name || !email || !company_name || !password)
    return res.status(400).json({ success: false, error: 'name, email, company_name and password are required' })
  if (password.length < 8)
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, error: 'Invalid email address' })

  const normalizedEmail = email.trim().toLowerCase()
  const authClient = getAuthClient()

  try {
    // 1. Create user in Supabase auth.users using Admin API (bypasses confirmation emails if auto-confirm)
    const { data: authData, error: authError } = await authClient.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name.trim(),
        company_name: company_name.trim()
      }
    })

    if (authError) {
      console.error('[AUTH] Supabase Auth user creation failed:', authError.message)
      return res.status(400).json({ success: false, error: authError.message })
    }

    const userId = authData.user.id

    // 2. Insert user profile into public.users table (needed for vehicles/leads foreign keys)
    const { error: dbUserError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        company_name: company_name.trim(),
        phone: phone ?? null
      })

    if (dbUserError) {
      console.error('[AUTH] Inserting user profile into public.users table failed:', dbUserError.message)
      // Rollback Auth user creation
      await authClient.auth.admin.deleteUser(userId)
      return res.status(500).json({ success: false, error: `Failed to create profile: ${dbUserError.message}` })
    }

    // 3. Insert credentials into user_credentials table
    const { error: dbCredsError } = await supabase
      .from('user_credentials')
      .insert({
        email: normalizedEmail,
        password_hash: hashPwd(password),
        name: name.trim(),
        company_name: company_name.trim(),
        phone: phone ?? null
      })

    if (dbCredsError) {
      console.warn('[AUTH] Warning: failed to record credentials in user_credentials table:', dbCredsError.message)
      // Non-blocking error since profile and auth user exist
    }

    console.log(`[AUTH] Successfully registered and synced dealer: ${normalizedEmail} (${company_name.trim()})`)

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: userId,
        email: normalizedEmail,
        name: name.trim(),
        company_name: company_name.trim(),
        phone: phone ?? null
      },
    })
  } catch (err) {
    console.error('[AUTH] Unexpected registration error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ success: false, error: 'Email and password are required' })

  const normalizedEmail = email.trim().toLowerCase()

  try {
    // 1. Query the credentials from the db using the globally shared supabase instance
    const { data: creds, error: credsError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (credsError) {
      console.error('[AUTH] Failed to query credentials:', credsError.message)
      return res.status(500).json({ success: false, error: credsError.message })
    }

    if (!creds || creds.password_hash !== hashPwd(password)) {
      console.log(`[AUTH] Login failed for: ${normalizedEmail} (invalid credentials)`)
      return res.status(401).json({ success: false, error: 'Invalid email or password. Please register first!' })
    }

    // 2. Retrieve profile from public.users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (dbError) {
      console.error('[AUTH] Failed to retrieve user profile:', dbError.message)
      return res.status(500).json({ success: false, error: 'Profile not found' })
    }

    console.log(`[AUTH] Successful login: ${normalizedEmail}`)

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id:           dbUser.id,
        email:        dbUser.email,
        name:         dbUser.name,
        company_name: dbUser.company_name,
        phone:        dbUser.phone || null,
      },
    })
  } catch (err) {
    console.error('[AUTH] Unexpected login error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PKCE helpers — generate code_verifier + code_challenge for server-side OAuth
// ─────────────────────────────────────────────────────────────────────────────
function generateCodeVerifier() {
  return crypto.randomBytes(48).toString('base64url') // 64-char URL-safe string
}

async function generateCodeChallenge(verifier) {
  // SHA-256 hash of the verifier, base64url encoded — no external deps needed
  const hash = crypto.createHash('sha256').update(verifier).digest()
  return hash.toString('base64url')
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/google
// Redirects the browser to the Supabase Google OAuth login page with PKCE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const redirectTo  = `${req.protocol}://${req.get('host')}/api/auth/google/callback`

    // ── PKCE: generate verifier + challenge ──
    const codeVerifier  = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Store verifier in an HttpOnly cookie so the callback can read it
    res.cookie('pkce_verifier', codeVerifier, {
      httpOnly: true,
      secure:   false,       // false = works over plain http in dev
      sameSite: 'lax',
      maxAge:   10 * 60 * 1000, // 10 minutes — enough for user to complete Google login
      path:     '/',
    })

    console.log(`[AUTH] Initiating Google OAuth with PKCE. Callback: ${redirectTo}`)

    const oauthUrl =
      `${supabaseUrl}/auth/v1/authorize` +
      `?provider=google` +
      `&redirect_to=${encodeURIComponent(redirectTo)}` +
      `&code_challenge=${encodeURIComponent(codeChallenge)}` +
      `&code_challenge_method=s256`

    res.redirect(oauthUrl)
  } catch (err) {
    console.error('[AUTH] Failed to build Google OAuth URL:', err.message)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    res.redirect(`${frontendUrl}/#auth_error=${encodeURIComponent(err.message)}`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/google/callback
// Supabase redirects here after the user completes Google Sign-In.
// Exchanges the auth code for a session (using the PKCE verifier from cookie)
// and syncs profile to public.users.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'

  // ── Full diagnostic log — helps trace what Supabase sends back ──
  console.log('[AUTH] Google callback hit.')
  console.log('[AUTH]   req.url    :', req.url)
  console.log('[AUTH]   req.query  :', req.query)
  console.log('[AUTH]   req.cookies:', req.cookies)

  try {
    const { code, error: reqError, error_description } = req.query

    if (reqError || error_description) {
      console.error('[AUTH] OAuth provider returned error:', reqError, error_description)
      return res.redirect(`${frontendUrl}/#auth_error=${encodeURIComponent(error_description || reqError)}`)
    }

    if (!code) {
      // Log everything to help diagnose — Supabase may have used a different param name
      console.error('[AUTH] No authorization code in callback.')
      console.error('[AUTH] All query params received:', JSON.stringify(req.query))
      console.error('[AUTH] Possible cause: redirect_to URL not whitelisted in Supabase Dashboard → Authentication → URL Configuration')
      return res.redirect(`${frontendUrl}/#auth_error=${encodeURIComponent('Google Sign-In failed: no authorization code received. Check Supabase URL configuration.')}`)
    }

    // ── Read PKCE verifier from cookie ──
    const codeVerifier = req.cookies?.pkce_verifier
    if (!codeVerifier) {
      console.error('[AUTH] PKCE verifier cookie missing — session may have expired or cookies are blocked')
      return res.redirect(`${frontendUrl}/#auth_error=${encodeURIComponent('Sign-in session expired. Please try again.')}`)
    }

    // Clear the PKCE cookie immediately — single use
    res.clearCookie('pkce_verifier', { path: '/' })

    console.log('[AUTH] Exchanging auth code for session with PKCE verifier...')

    // Use the Supabase REST exchange endpoint directly with the verifier
    const tokenRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
      },
      body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('[AUTH] PKCE token exchange failed:', tokenRes.status, errBody)
      // Fallback: try the SDK method (works if Supabase project has PKCE disabled)
      const authClient = getAuthClient()
      const { data: sdkData, error: sdkError } = await authClient.auth.exchangeCodeForSession(code)
      if (sdkError) {
        console.error('[AUTH] SDK fallback also failed:', sdkError.message)
        throw sdkError
      }
      var session = sdkData.session
      var user    = sdkData.session.user
    } else {
      const tokenData = await tokenRes.json()
      console.log('[AUTH] PKCE token exchange successful.')
      var session = tokenData
      var user    = tokenData.user
    }

    const token = session.access_token || session.provider_token || ''

    console.log('[AUTH] Code exchange complete. Syncing profile to public.users...')

    // ── Sync Google user profile to public.users ──
    const { data: dbUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (queryError) {
      console.warn('[AUTH] Error querying user profile:', queryError.message)
    }

    if (!dbUser) {
      const name        = user.user_metadata?.full_name || user.email.split('@')[0]
      const companyName = user.user_metadata?.company_name || `${name}'s Dealership`
      const { error: insertErr } = await supabase.from('users').insert({
        id:           user.id,
        name,
        email:        user.email,
        company_name: companyName,
        phone:        user.phone || null,
      })
      if (insertErr) {
        console.error('[AUTH] Failed to insert profile for OAuth user:', insertErr.message)
        throw new Error('Database sync failed: ' + insertErr.message)
      }
      console.log(`[AUTH] Synced new Google user to public.users: ${user.email}`)
    } else {
      console.log(`[AUTH] Existing Google user found in public.users: ${user.email}`)
    }

    const userPayload = {
      id:           user.id,
      email:        user.email,
      name:         dbUser?.name || user.user_metadata?.full_name || user.email.split('@')[0],
      company_name: dbUser?.company_name || user.user_metadata?.company_name || `${user.email.split('@')[0]}'s Dealership`,
      phone:        dbUser?.phone || user.phone || null,
      token,
      access_token: token,
    }

    console.log('[AUTH] Google OAuth flow complete — redirecting to dashboard.')
    res.redirect(
      `${frontendUrl}?token=${encodeURIComponent(token)}#auth_success=${encodeURIComponent(JSON.stringify(userPayload))}`
    )
  } catch (err) {
    console.error('[AUTH] Google OAuth callback failed:', err.message)
    res.redirect(`${frontendUrl}/#auth_error=${encodeURIComponent(err.message)}`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// Body: { id?, email?, name?, company_name?, phone?, location? }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', async (req, res, next) => {
  try {
    const { id, email, name, company_name, phone, location } = req.body

    if (!id && !email) {
      return res.status(400).json({ success: false, error: 'User ID or email is required' })
    }

    const updates = {}
    if (name !== undefined) updates.name = String(name).trim()
    if (company_name !== undefined) updates.company_name = String(company_name).trim()
    if (phone !== undefined) updates.phone = phone
    if (location !== undefined) updates.location = location

    let query = supabase.from('users').update(updates)
    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('email', String(email).trim().toLowerCase())
    }

    const { data: updatedUser, error: updateErr } = await query.select().maybeSingle()

    if (updateErr) {
      console.warn('[AUTH] Warning updating public.users profile table:', updateErr.message)
    }

    // Sync credentials table if needed
    if (email || id) {
      try {
        const credUpdates = {}
        if (name !== undefined) credUpdates.name = String(name).trim()
        if (company_name !== undefined) credUpdates.company_name = String(company_name).trim()
        if (phone !== undefined) credUpdates.phone = phone

        let cQuery = supabase.from('user_credentials').update(credUpdates)
        if (email) cQuery = cQuery.eq('email', String(email).trim().toLowerCase())
        await cQuery
      } catch (cErr) {
        console.warn('[AUTH] Non-critical credentials update warning:', cErr.message)
      }
    }

    const resultUser = {
      id: updatedUser?.id || id,
      email: updatedUser?.email || email,
      name: updatedUser?.name || name || company_name,
      company_name: updatedUser?.company_name || company_name,
      phone: updatedUser?.phone ?? phone ?? null,
      location: updatedUser?.location ?? location ?? null,
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: resultUser,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router


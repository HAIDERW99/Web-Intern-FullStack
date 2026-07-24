/**
 * Lead / Enquiry Routes
 *
 * GET    /api/leads/:dealerId     — fetch all leads for a dealer (Dashboard)
 * POST   /api/leads               — submit a buyer enquiry (VDP contact form)
 * PATCH  /api/leads/:id/reply     — mark a lead as 'Replied'
 */

const express  = require('express')
const router   = express.Router()
const supabase = require('../config/supabase')
const validate = require('../middleware/validate')

// ─── Allowed status values ─────────────────────────────────────────────────
const VALID_LEAD_STATUSES = ['Unread', 'Replied']

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leads/:dealerId
// Returns all leads for the specified dealer, newest first.
// Query: status ('Unread' | 'Replied'), page, limit
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:dealerId', async (req, res, next) => {
  try {
    const { dealerId } = req.params
    const {
      status,
      page  = 1,
      limit = 20,
    } = req.query

    if (!dealerId) {
      return res.status(400).json({ success: false, error: 'dealerId is required' })
    }

    const pageNum   = Math.max(1, parseInt(page,  10) || 1)
    const limitNum  = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const rangeFrom = (pageNum - 1) * limitNum
    const rangeTo   = rangeFrom + limitNum - 1

    let query = supabase
      .from('leads')
      .select(
        `
        id, vehicle_id, dealer_id,
        buyer_name, buyer_email, buyer_phone,
        message, status,
        created_at,
        vehicles!leads_vehicle_id_fkey (
          id, make, model, year, price
        )
        `,
        { count: 'exact' }
      )
      .eq('dealer_id', dealerId)
      .order('id', { ascending: false })

    // Optional filter by status
    if (status && VALID_LEAD_STATUSES.includes(status)) {
      query = query.eq('status', status)
    }

    query = query.range(rangeFrom, rangeTo)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total:       count ?? 0,
        page:        pageNum,
        limit:       limitNum,
        total_pages: Math.ceil((count ?? 0) / limitNum),
      },
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leads
// Body: { vehicle_id, dealer_id, buyer_name, buyer_email, buyer_phone?, message? }
// Called from the VDP contact / enquiry form.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  validate(['vehicle_id', 'buyer_name', 'buyer_email']),
  async (req, res, next) => {
    try {
      const {
        vehicle_id,
        dealer_id   = null,
        buyer_name,
        buyer_email,
        buyer_phone = null,
        message     = '',
      } = req.body

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(buyer_email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address' })
      }

      if (isNaN(Number(vehicle_id))) {
        return res.status(400).json({ success: false, error: 'Invalid vehicle_id' })
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          vehicle_id:  Number(vehicle_id),
          dealer_id,
          buyer_name:  buyer_name.trim(),
          buyer_email: buyer_email.trim().toLowerCase(),
          buyer_phone: buyer_phone ? buyer_phone.trim() : null,
          message:     message.trim(),
          status:      'Unread',
        })
        .select()
        .single()

      if (error) throw error

      res.status(201).json({
        success: true,
        message: 'Enquiry submitted successfully. The dealer will be in touch shortly.',
        data,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leads/:id/reply
// Marks the lead status as 'Replied' (called from Dealer Dashboard).
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/reply', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, error: 'Invalid lead ID' })
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ status: 'Replied' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Lead not found' })
      }
      throw error
    }

    res.json({
      success: true,
      message: 'Lead marked as Replied',
      data,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router

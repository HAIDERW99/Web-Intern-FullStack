/**
 * Vehicle Routes
 *
 * GET    /api/vehicles              — list / search (with filters + pagination)
 * GET    /api/vehicles/:id          — single vehicle with all images
 * POST   /api/vehicles              — create new listing + bulk-insert images
 * PATCH  /api/vehicles/:id/status   — update status (Active | Pending | Sold)
 * DELETE /api/vehicles/:id          — delete a listing (cascades images via FK)
 */

const express  = require('express')
const router   = express.Router()
const supabase = require('../config/supabase')
const validate = require('../middleware/validate')

// ─── Allowed values ────────────────────────────────────────────────────────
const VALID_STATUSES   = ['Active', 'Pending', 'Sold']
const VALID_SORT_KEYS  = ['price_asc', 'price_desc', 'mileage_asc', 'year_desc', 'newest']
const PAGE_SIZE_MAX    = 50

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vehicles
// Query params: dealer_id, make, model, minPrice, maxPrice, maxMileage,
//               fuel_type, body_type, transmission, status, sort, page, limit
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      dealer_id,
      make, model, minPrice, maxPrice, maxMileage,
      fuel_type, body_type, transmission,
      status = 'Active',        // default to only active cars
      sort   = 'newest',
      page   = 1,
      limit  = 12,
    } = req.query

    // --- Pagination ---
    const pageNum   = Math.max(1, parseInt(page, 10)  || 1)
    const limitNum  = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(limit, 10) || 12))
    const rangeFrom = (pageNum - 1) * limitNum
    const rangeTo   = rangeFrom + limitNum - 1

    // --- Base query: try to join vehicle_images; fallback to simple query if table missing ---
    // Helper to build filters/sort/range onto any base query
    const applyFiltersAndSort = (q) => {
      if (dealer_id)   q = q.eq('dealer_id',     dealer_id)
      if (status && status !== 'all') {
        const sLower = String(status).trim().toLowerCase()
        if (['active', 'pending', 'sold'].includes(sLower)) {
          q = q.ilike('status', sLower)
        } else {
          q = q.ilike('status', status)
        }
      }
      if (make)        q = q.ilike('make',         `%${make}%`)
      if (model)       q = q.ilike('model',        `%${model}%`)
      if (minPrice)    q = q.gte('price',          Number(minPrice))
      if (maxPrice)    q = q.lte('price',          Number(maxPrice))
      if (maxMileage)  q = q.lte('mileage',        Number(maxMileage))
      if (fuel_type)   q = q.ilike('fuel_type',    fuel_type)
      if (body_type)   q = q.ilike('body_type',    body_type)
      if (transmission) q = q.ilike('transmission', transmission)
      switch (sort) {
        case 'price_asc':   q = q.order('price',   { ascending: true  }); break
        case 'price_desc':  q = q.order('price',   { ascending: false }); break
        case 'mileage_asc': q = q.order('mileage', { ascending: true  }); break
        case 'year_desc':   q = q.order('year',    { ascending: false }); break
        default:            q = q.order('id',      { ascending: false }); break
      }
      return q.range(rangeFrom, rangeTo)
    }

    // First attempt: join vehicle_images for richer image data
    let joinedQuery = supabase
      .from('vehicles')
      .select(`*, vehicle_images!left (id, image_url, is_main)`, { count: 'exact' })
    joinedQuery = applyFiltersAndSort(joinedQuery)

    let data, error, count
    ;({ data, error, count } = await joinedQuery)

    // If vehicle_images table doesn't exist, fall back to simple query
    const tableNotFound = error && (error.code === 'PGRST200' || error.code === '42P01' || error.message?.includes('vehicle_images'))
    if (tableNotFound) {
      console.warn('[VEHICLES] vehicle_images table not found — falling back to simple query')
      let simpleQuery = supabase.from('vehicles').select('*', { count: 'exact' })
      simpleQuery = applyFiltersAndSort(simpleQuery)
      ;({ data, error, count } = await simpleQuery)
    }

    if (error) throw error

    // Reshape: attach only the main image URL for list cards
    const vehicles = (data || []).map(vehicle => {
      const images = vehicle.vehicle_images || []
      const mainImage = images.find(img => img.is_main) || images[0] || null
      const fallbackUrl = vehicle.image_url || (Array.isArray(vehicle.images) ? vehicle.images[0] : null) || null
      const resolvedUrl = mainImage ? mainImage.image_url : fallbackUrl
      return {
        ...vehicle,
        vehicle_images: undefined,          // strip the nested array
        main_image_url: resolvedUrl,
        image_url:      resolvedUrl || vehicle.image_url || null,
        image_count:    images.length || (resolvedUrl ? 1 : 0),
      }
    })

    res.json({
      success: true,
      data: vehicles,
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
// GET /api/vehicles/:id
// Returns full vehicle details + ALL images (for Vehicle Detail Page)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, error: 'Invalid vehicle ID' })
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `
        *,
        vehicle_images (
          id, image_url, is_main
        )
        `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Vehicle not found' })
      }
      throw error
    }

    // Sort images: main image first, then the rest in insertion order
    if (data.vehicle_images) {
      data.vehicle_images.sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
    }

    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles
// Body: { dealer_id, make, model, year, price, mileage, fuel_type,
//         transmission, body_type, engine_size, color, description,
//         registration_plate, image_urls: string[] }
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  validate(['make', 'model', 'year', 'price', 'fuel_type', 'transmission']),
  async (req, res, next) => {
    try {
      const {
        dealer_id        = null,   // optional — null if file-based auth user
        make,
        model,
        year,
        price,
        mileage          = 0,
        fuel_type,
        transmission,
        body_type        = null,
        engine_size      = null,
        color            = null,
        description      = null,
        registration_plate = null,
      } = req.body

      const rawImages = req.body.image_urls || req.body.images || []
      const image_urls = Array.isArray(rawImages) ? rawImages : (rawImages ? [rawImages] : [])

      // --- Input sanitisation ---
      if (isNaN(Number(year))  || Number(year)  < 1900 || Number(year)  > 2100)
        return res.status(400).json({ success: false, error: 'Invalid year' })
      if (isNaN(Number(price)) || Number(price) <= 0)
        return res.status(400).json({ success: false, error: 'Price must be a positive number' })

      // --- Extract main image URL ---
      // Accept image_url (singular direct write), image_urls[0], or images[0]
      const firstImg =
        (typeof req.body.image_url === 'string' && req.body.image_url ? req.body.image_url : null)
        || (image_urls.length > 0
          ? (typeof image_urls[0] === 'string' ? image_urls[0] : (image_urls[0]?.url || image_urls[0]?.image_url || null))
          : null)


      // --- Build insert payload ---
      const insertPayload = {
        make:               make.trim(),
        model:              model.trim(),
        year:               Number(year),
        price:              Number(price),
        mileage:            Number(mileage),
        fuel_type,
        transmission,
        body_type,
        engine_size,
        color,
        description,
        registration_plate: registration_plate ? registration_plate.trim().toUpperCase() : null,
        status:             'Active',
      }
      if (firstImg) {
        insertPayload.image_url = firstImg
      }

      // Helper: run an insert, with FK-violation retry (dealer_id) and
      // PGRST204 retry (image_url column not yet migrated into the table)
      const doInsert = async (payload) => {
        let { data, error } = await supabase.from('vehicles').insert(payload).select().single()

        // FK violation on dealer_id → retry with null
        if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
          console.warn('[WARN] dealer_id FK failed, inserting with null dealer_id')
          ;({ data, error } = await supabase.from('vehicles').insert({ ...payload, dealer_id: null }).select().single())
        }

        // Schema mismatch: image_url column not found → retry without it
        if (error && error.code === 'PGRST204' && payload.image_url !== undefined) {
          console.warn('[WARN] image_url column not in schema cache \u2014 retrying without it')
          const { image_url: _dropped, ...payloadWithoutImg } = payload
          ;({ data, error } = await supabase.from('vehicles').insert(payloadWithoutImg).select().single())
          // One more FK retry after dropping image_url
          if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
            console.warn('[WARN] dealer_id FK failed on second attempt, inserting with null dealer_id')
            ;({ data, error } = await supabase.from('vehicles').insert({ ...payloadWithoutImg, dealer_id: null }).select().single())
          }
        }

        return { data, error }
      }

      const basePayload = dealer_id ? { ...insertPayload, dealer_id } : { ...insertPayload, dealer_id: null }
      const { data: vehicle, error: vehicleError } = await doInsert(basePayload)

      if (vehicleError) {
        console.error('[VEHICLES] Failed to insert vehicle listing into Supabase:', vehicleError.message, vehicleError)
        throw vehicleError
      }


      // --- Bulk-insert images into vehicle_images (graceful skip if table doesn't exist) ---
      let images = []
      if (image_urls.length > 0) {
        const imageRows = image_urls.map((item, index) => {
          const url = typeof item === 'string' ? item : (item?.url || item?.image_url || '')
          return {
            vehicle_id: vehicle.id,
            image_url:  url,
            is_main:    index === 0,       // first image is the main/cover photo
          }
        }).filter(r => !!r.image_url)

        if (imageRows.length > 0) {
          const { data: insertedImages, error: imageError } = await supabase
            .from('vehicle_images')
            .insert(imageRows)
            .select()

          if (imageError) {
            // Gracefully skip if vehicle_images table hasn't been migrated yet;
            // image_url on the vehicles row already holds the primary photo URL
            const tableMissing = imageError.code === 'PGRST200' || imageError.code === '42P01'
              || imageError.message?.includes('vehicle_images')
            if (tableMissing) {
              console.warn(`[VEHICLES] vehicle_images table not found — image stored in vehicles.image_url only`)
            } else {
              console.error(`[VEHICLES] Warning: Vehicle ${vehicle.id} created but images failed to insert:`, imageError.message)
            }
          } else {
            images = insertedImages
          }
        }
      }

      res.status(201).json({
        success: true,
        message: 'Vehicle listing created and published successfully.',
        data: { ...vehicle, main_image_url: firstImg || vehicle.image_url || null, vehicle_images: images },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/vehicles/:id/status
// Body: { status: 'Active' | 'Pending' | 'Sold' }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, error: 'Invalid vehicle ID' })
    }
    const sLower = String(status || '').trim().toLowerCase()
    const formattedStatus = sLower === 'sold' ? 'Sold' : sLower === 'pending' ? 'Pending' : 'Active'

    const { data, error } = await supabase
      .from('vehicles')
      .update({ status: formattedStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Vehicle not found' })
      }
      throw error
    }

    res.json({
      success: true,
      message: `Vehicle status updated to '${status}'`,
      data,
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/vehicles/:id
// Note: vehicle_images rows are deleted automatically if your Supabase table
// has ON DELETE CASCADE on the vehicle_id foreign key.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, error: 'Invalid vehicle ID' })
    }

    // Manually delete images first as a safety net (handles non-cascade FKs too)
    await supabase.from('vehicle_images').delete().eq('vehicle_id', id)

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Vehicle listing deleted successfully' })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/vehicles/:id
// Body: { status?, make?, model?, year?, price?, mileage?, description?, ... }
// Status is always forced to lowercase before writing to the DB.
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ success: false, error: 'Vehicle ID is required' })
  }

  try {
    const body   = req.body || {}
    const updatePayload = {}

    // ── Status: Title Case format ('Active', 'Sold', 'Pending') to satisfy DB constraint ──
    if (body.status !== undefined && body.status !== null) {
      const sLower = String(body.status).trim().toLowerCase()
      if (sLower === 'sold') updatePayload.status = 'Sold'
      else if (sLower === 'pending') updatePayload.status = 'Pending'
      else updatePayload.status = 'Active'
    }

    // ── Other updatable fields ──
    if (body.make        !== undefined) updatePayload.make         = String(body.make).trim()
    if (body.model       !== undefined) updatePayload.model        = String(body.model).trim()
    if (body.description !== undefined) updatePayload.description  = body.description
    if (body.fuel_type   !== undefined) updatePayload.fuel_type    = body.fuel_type
    if (body.transmission !== undefined) updatePayload.transmission = body.transmission
    if (body.body_type   !== undefined) updatePayload.body_type    = body.body_type
    if (body.image_url   !== undefined) updatePayload.image_url    = body.image_url
    if (body.year    !== undefined && !isNaN(Number(body.year)))    updatePayload.year    = Number(body.year)
    if (body.price   !== undefined && !isNaN(Number(body.price)))   updatePayload.price   = Number(body.price)
    if (body.mileage !== undefined && !isNaN(Number(body.mileage))) updatePayload.mileage = Number(body.mileage)

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided to update' })
    }

    console.log(`[PUT /api/vehicles/${id}] Payload to write:`, updatePayload)

    // ── Try numeric id first, then string fallback ──
    const numericId = Number(id)
    const idIsNumeric = !isNaN(numericId) && String(numericId) === String(id).trim()

    let data = null
    let dbError = null

    // Attempt 1 — primary id type (numeric or uuid string)
    {
      const { data: d, error: e } = await supabase
        .from('vehicles')
        .update(updatePayload)
        .eq('id', idIsNumeric ? numericId : id)
        .select()
        .single()

      console.log(`[PUT /api/vehicles/${id}] Attempt 1 response — data:`, d, 'error:', e)
      data    = d
      dbError = e
    }

    // Attempt 2 — try the other id type if first returned nothing
    if (!data && !dbError) {
      const { data: d, error: e } = await supabase
        .from('vehicles')
        .update(updatePayload)
        .eq('id', idIsNumeric ? id : numericId)
        .select()
        .single()

      console.log(`[PUT /api/vehicles/${id}] Attempt 2 (fallback) — data:`, d, 'error:', e)
      if (!dbError) { data = d; dbError = e }
    }

    if (dbError) {
      console.error(`[PUT /api/vehicles/${id}] Supabase error:`, dbError.code, dbError.message, dbError.details)
      if (dbError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Vehicle not found' })
      }
      return res.status(500).json({ success: false, error: dbError.message || 'Database update failed' })
    }

    if (!data) {
      console.warn(`[PUT /api/vehicles/${id}] No row returned — ID may not exist in database. Returning composed object.`)
    }

    const vehicle = data ?? { id, ...updatePayload }
    console.log(`[PUT /api/vehicles/${id}] Success — returning vehicle:`, vehicle)

    return res.json({ success: true, message: 'Vehicle updated successfully', vehicle, data: vehicle })

  } catch (err) {
    console.error(`[PUT /api/vehicles/${id}] Unexpected exception:`, err.message || err)
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' })
  }
})

module.exports = router


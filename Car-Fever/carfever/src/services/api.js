/**
 * CarFever API Client
 *
 * Centralised fetch wrapper — all backend calls go through here.
 * Set VITE_API_BASE_URL in your .env file.
 *
 * Usage:
 *   import api from '../services/api'
 *   const { data } = await api.vehicles.getAll({ make: 'BMW', page: 1 })
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// ─── Generic fetch helper ─────────────────────────────────────────────────
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }

  const response = await fetch(url, config)
  const json     = await response.json()

  if (!response.ok) {
    const message = json?.error || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return json
}

// ─── Helper: build query string from an object (ignores undefined/null/'') ──
function toQueryString(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, value)
    }
  })
  const str = qs.toString()
  return str ? `?${str}` : ''
}

// ─── Vehicle endpoints ────────────────────────────────────────────────────
const vehicles = {
  /**
   * GET /api/vehicles
   * @param {object} filters  - { make, model, minPrice, maxPrice, maxMileage,
   *                              fuel_type, body_type, transmission,
   *                              status, sort, page, limit }
   */
  getAll(filters = {}) {
    return request(`/api/vehicles${toQueryString(filters)}`)
  },

  /**
   * GET /api/vehicles/:id
   * @param {number|string} id
   */
  getById(id) {
    return request(`/api/vehicles/${id}`)
  },

  /**
   * POST /api/vehicles
   * @param {object} payload - vehicle data + image_urls array
   */
  create(payload) {
    return request('/api/vehicles', {
      method: 'POST',
      body:   JSON.stringify(payload),
    })
  },

  /**
   * PUT /api/vehicles/:id
   * @param {number|string} id
   * @param {object} payload
   */
  update(id, payload) {
    return request(`/api/vehicles/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    })
  },

  /**
   * PATCH /api/vehicles/:id/status
   * @param {number|string} id
   * @param {'Active'|'Pending'|'Sold'} status
   */
  updateStatus(id, status) {
    return request(`/api/vehicles/${id}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    })
  },

  /**
   * DELETE /api/vehicles/:id
   * @param {number|string} id
   */
  remove(id) {
    return request(`/api/vehicles/${id}`, { method: 'DELETE' })
  },
}

// ─── Lead endpoints ───────────────────────────────────────────────────────
const leads = {
  /**
   * GET /api/leads/:dealerId
   * @param {string} dealerId
   * @param {object} params  - { status, page, limit }
   */
  getByDealer(dealerId, params = {}) {
    return request(`/api/leads/${dealerId}${toQueryString(params)}`)
  },

  /**
   * POST /api/leads
   * @param {object} payload - { vehicle_id, dealer_id, buyer_name,
   *                             buyer_email, buyer_phone?, message? }
   */
  submit(payload) {
    return request('/api/leads', {
      method: 'POST',
      body:   JSON.stringify(payload),
    })
  },

  /**
   * PATCH /api/leads/:id/reply
   * @param {number|string} id
   */
  markReplied(id) {
    return request(`/api/leads/${id}/reply`, { method: 'PATCH' })
  },
}

// ─── Auth endpoints ───────────────────────────────────────────────────────
const auth = {
  /**
   * POST /api/auth/register
   * @param {{ name, email, company_name, password, phone? }} payload
   */
  register(payload) {
    return request('/api/auth/register', {
      method: 'POST',
      body:   JSON.stringify(payload),
    })
  },

  /**
   * POST /api/auth/login
   * @param {{ email, password }} payload
   */
  login(payload) {
    return request('/api/auth/login', {
      method: 'POST',
      body:   JSON.stringify(payload),
    })
  },

  /**
   * PUT /api/auth/profile
   * @param {{ id?, email?, name?, company_name?, phone?, location? }} payload
   */
  updateProfile(payload) {
    return request('/api/auth/profile', {
      method: 'PUT',
      body:   JSON.stringify(payload),
    })
  },
}

const api = { auth, vehicles, leads }
export default api

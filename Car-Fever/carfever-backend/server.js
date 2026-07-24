/**
 * CarFever Backend — Entry Point
 *
 * Stack : Node.js + Express + Supabase (PostgreSQL)
 * Start : node server.js          (production)
 *         nodemon server.js       (development — via `npm run dev`)
 */

require('dotenv').config()

const express      = require('express')
const cors         = require('cors')
const vehicleRoutes = require('./src/routes/vehicles')
const leadRoutes    = require('./src/routes/leads')
const authRoutes    = require('./src/routes/auth')
const errorHandler  = require('./src/middleware/errorHandler')

// ─── App initialisation ────────────────────────────────────────────────────
const app = express()

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin '${origin}' is not allowed`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// ─── Body parsing ──────────────────────────────────────────────────────────
// 10 MB limit covers large base64 image previews sent from the frontend
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ─── Health-check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:  'OK',
    service: 'carfever-backend',
    env:     process.env.NODE_ENV || 'development',
    ts:      new Date().toISOString(),
  })
})

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/leads',    leadRoutes)

// ─── 404 handler for unknown routes ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// ─── Global error handler (must be last) ─────────────────────────────────
app.use(errorHandler)

// ─── Start server (local/dev only — Vercel runs as a serverless function) ──
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`✅  CarFever API running on http://localhost:${PORT}`)
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`)
  })
}

module.exports = app   // exported for Vercel serverless + testing

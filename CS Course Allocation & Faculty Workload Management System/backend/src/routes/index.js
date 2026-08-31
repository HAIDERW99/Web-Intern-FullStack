const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const allocationRoutes = require('./allocationRoutes');
const facultyRoutes = require('./facultyRoutes');
const academicRoutes = require('./academicRoutes');
const courseRoutes = require('./courseRoutes');
const conflictRoutes = require('./conflictRoutes');
const logRoutes = require('./logRoutes');
const workloadRoutes = require('./workloadRoutes');
const recommendationRoutes = require('./recommendationRoutes');

// Root API Index & Info
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CS Course Allocation & Faculty Workload Management API (v1)',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/v1/health',
      auth: 'POST /api/v1/auth/login, GET /api/v1/auth/me',
      academic: 'GET /api/v1/academic/sessions, GET /api/v1/academic/programmes',
      faculty: 'GET /api/v1/faculty, POST /api/v1/faculty/permanent',
      courses: 'GET /api/v1/courses',
      allocations: 'GET /api/v1/allocations, GET /api/v1/allocations/grid',
      workload: 'GET /api/v1/workload/summary, POST /api/v1/workload/simulate',
      conflicts: 'GET /api/v1/conflicts/scan',
      recommendations: 'POST /api/v1/recommendations/course',
      logs: 'GET /api/v1/logs'
    },
    frontendApp: 'http://localhost:3000',
    timestamp: new Date().toISOString(),
  });
});

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'CS Course Allocation & Faculty Workload Management API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/allocations', allocationRoutes);
router.use('/faculty', facultyRoutes);
router.use('/academic', academicRoutes);
router.use('/courses', courseRoutes);
router.use('/conflicts', conflictRoutes);
router.use('/logs', logRoutes);
router.use('/workload', workloadRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;

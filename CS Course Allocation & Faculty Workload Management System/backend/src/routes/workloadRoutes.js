const express = require('express');
const router = express.Router();
const workloadController = require('../controllers/workloadController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// 1. Calculate Real-time Workload for a specific Faculty
router.get('/faculty/:facultyId', workloadController.getFacultyWorkload);

// 2. Department-wide Workload Summary & Distribution
router.get('/summary', workloadController.getDepartmentWorkloadSummary);

// 3. Simulate Course Assignment Impact before committing
router.post('/simulate', workloadController.simulateAllocationImpact);

module.exports = router;

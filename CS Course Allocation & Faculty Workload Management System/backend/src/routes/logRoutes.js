const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHOD } = require('../middlewares/roleMiddleware');

router.use(authenticate);

// Activity logs inspection is reserved for HOD and authorized auditors
router.get('/', requireHOD, activityLogController.getActivityLogs);

module.exports = router;

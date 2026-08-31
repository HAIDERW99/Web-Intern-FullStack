const express = require('express');
const router = express.Router();
const conflictController = require('../controllers/conflictController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireConvenerOrHigher } = require('../middlewares/roleMiddleware');

router.use(authenticate);

// 1. Live Session Scan
router.get('/scan', conflictController.scanConflicts);

// 2. Sync / Persist Scan to Database
router.post('/sync', requireConvenerOrHigher, conflictController.syncSessionConflicts);

// 3. Query Database Conflicts
router.get('/', conflictController.getConflicts);

// 4. Resolve Conflict
router.patch('/:id/resolve', requireConvenerOrHigher, conflictController.resolveConflict);

module.exports = router;

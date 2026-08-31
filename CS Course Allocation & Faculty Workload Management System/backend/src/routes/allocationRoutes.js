const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHOD, requireConvenerOrHigher } = require('../middlewares/roleMiddleware');
const { requireScopeAccess } = require('../middlewares/scopeMiddleware');

// All allocation routes require authentication
router.use(authenticate);

// 1. Read endpoints
router.get('/', allocationController.getAllocations);
router.get('/grid', allocationController.getSectionGrid);
router.get('/:id', allocationController.getAllocationById);
router.get('/:id/history', allocationController.getAllocationHistory);

// 2. Create / Draft Allocation (Checked against Granular Scope)
router.post(
  '/',
  requireConvenerOrHigher,
  requireScopeAccess({ action: 'write' }),
  allocationController.createAllocation
);

// 3. Update Allocation (Scope Protected & Locked if Approved for Team Members)
router.put(
  '/:id',
  requireConvenerOrHigher,
  requireScopeAccess({ action: 'write' }),
  allocationController.updateAllocation
);

// 4. Approval Pipeline: Submit for HOD Review (Team Member / Convener)
router.patch(
  '/:id/submit',
  requireConvenerOrHigher,
  requireScopeAccess({ action: 'write' }),
  allocationController.submitForReview
);

// 5. Approval Pipeline: Final Approval (Strictly HOD / Dean / Admin - Locks Record)
router.patch(
  '/:id/approve',
  requireHOD,
  allocationController.approveAllocation
);

// 6. Approval Pipeline: Rejection with Reason (Strictly HOD / Dean / Admin)
router.patch(
  '/:id/reject',
  requireHOD,
  allocationController.rejectAllocation
);

// 7. Bulk Status Transition (Batch Submit or Batch Approve)
router.post(
  '/bulk-status',
  requireConvenerOrHigher,
  allocationController.bulkUpdateStatus
);

// 8. Delete Allocation (Scope Protected & Blocked if Approved)
router.delete(
  '/:id',
  requireConvenerOrHigher,
  requireScopeAccess({ action: 'write' }),
  allocationController.deleteAllocation
);

module.exports = router;

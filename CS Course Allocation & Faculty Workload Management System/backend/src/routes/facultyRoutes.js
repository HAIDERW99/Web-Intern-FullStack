const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHOD } = require('../middlewares/roleMiddleware');

router.use(authenticate);

// 1. Directory & Filters
router.get('/', facultyController.getFacultyList);

// 2. Single Faculty Detail (with joined visiting metadata & active allocations)
router.get('/:id', facultyController.getFacultyById);

// 3. Create Faculty (Permanent / Visiting) - HOD / Admin Only
router.post('/', requireHOD, facultyController.createFaculty);

// 4. Update Faculty (Permanent / Visiting) - HOD / Admin Only
router.put('/:id', requireHOD, facultyController.updateFaculty);

// 5. Delete or Deactivate Faculty - HOD / Admin Only
router.delete('/:id', requireHOD, facultyController.deleteFaculty);

module.exports = router;

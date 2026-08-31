const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHOD } = require('../middlewares/roleMiddleware');

router.use(authenticate);

// 1. Master Catalog & Offerings
router.get('/', courseController.getCourses);
router.get('/offerings', courseController.getOfferings);
router.post('/parse-credits', courseController.testParseCredits);

// 2. Single Course
router.get('/:id', courseController.getCourseById);

// 3. Create Course (HOD / Admin)
router.post('/', requireHOD, courseController.createCourse);

// 4. Update Course (HOD / Admin)
router.put('/:id', requireHOD, courseController.updateCourse);

// 5. Delete Course (HOD / Admin)
router.delete('/:id', requireHOD, courseController.deleteCourse);

module.exports = router;

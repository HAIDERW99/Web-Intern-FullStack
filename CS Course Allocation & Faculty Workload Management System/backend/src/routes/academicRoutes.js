const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHOD } = require('../middlewares/roleMiddleware');

router.use(authenticate);

// Sessions
router.get('/sessions', academicController.getSessions);
router.post('/sessions', requireHOD, academicController.createSession);

// Programmes
router.get('/programmes', academicController.getProgrammes);

// Semesters
router.get('/semesters', academicController.getSemesters);

// Sections
router.get('/sections', academicController.getSections);

module.exports = router;

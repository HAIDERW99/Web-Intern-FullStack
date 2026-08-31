const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Rank faculty candidates for course assignment
router.post('/course', recommendationController.getFacultyRecommendations);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireHOD } = require('../middlewares/roleMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/assign-scope', authenticate, requireHOD, authController.assignScope);

module.exports = router;

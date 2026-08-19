const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;

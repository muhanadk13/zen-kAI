const express = require('express');
const { signup, login } = require('../controllers/authController');
const { check } = require('express-validator');
const limiter = require('../middleware/rateLimiter');


const router = express.Router();

// 👤 Public routes with validation middleware
router.post(
  '/signup',
  [
    check('email', 'Not a valid email').isEmail(),
    check('password', 'Must be at least 6 characters').isLength({ min: 6 })
  ],
  signup
);

router.post(
    '/login',
    limiter,
    [
    check('email', 'Not a valid email').isEmail(),
    check('password', 'Incorrect password').notEmpty()
    ],
  login
);

module.exports = router;

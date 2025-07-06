const express = require('express');
const { signup, login } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// 👤 Public routes
router.post('/signup', signup);
router.post('/login', login);

// 🔒 Protected route (requires JWT)
router.post('/checkin', requireAuth, (req, res) => {
  res.json({
    message: 'Check-in success',
    user: req.userId,
  });
});

module.exports = router;

const express = require('express');
const { checkin, history } = require('../controllers/checkinController');
const requireAuth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', requireAuth, checkin);
router.get('/history', requireAuth, history);

module.exports = router;

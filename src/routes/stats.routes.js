const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/statsController');

// Route publique ou protégée par auth middleware selon ton besoin
router.get('/', getDashboardStats);

module.exports = router;

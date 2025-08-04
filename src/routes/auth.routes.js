const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/admin', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ message: 'Bienvenue Admin !' });
});

router.get('/user', authenticate, authorize('USER', 'ADMIN'), (req, res) => {
  res.json({ message: 'Bienvenue utilisateur connecté !' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées avec rôles

// Exemple pour accès uniquement DIRECTEUR
router.get('/directeur', authenticate, authorize('DIRECTEUR'), (req, res) => {
  res.json({ message: 'Bienvenue Directeur !' });
});

// Exemple pour accès clients et responsables
router.get('/client-responsable', authenticate, authorize('CLIENT', 'RESPONSABLE_AEP', 'RESPONSABLE_ASSEU'), (req, res) => {
  res.json({ message: 'Bienvenue client ou responsable connecté !' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const visiteController = require('../controllers/visite.controller');
const authenticate = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Récupérer les visites par type (AEP, ASSEU, LES_DEUX)
router.get('/by-type/:type', authenticate, visiteController.getVisitesByType);

// Récupérer les visites par client
router.get('/by-client/:clientId', authenticate, visiteController.getVisitesByClient);

// Créer une visite (avec document optionnel)
router.post('/', authenticate, upload.single('document'), visiteController.createVisite);

// Récupérer une visite par ID
router.get('/details/:id', authenticate, visiteController.getVisiteById);

// Modifier une visite
router.put('/:id', authenticate, visiteController.updateVisite);

// Supprimer une visite
router.delete('/:id', authenticate, visiteController.deleteVisite);

module.exports = router;

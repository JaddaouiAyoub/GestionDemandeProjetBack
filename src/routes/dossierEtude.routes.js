const express = require('express');
const router = express.Router();
const dossierController = require('../controllers/dossierEtude.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// GET dossiers du client
router.get('/client', authenticate, authorize('CLIENT'), dossierController.getClientDossiers);

// PUT statut d’un dossier
router.put('/:id/status', authenticate, authorize('RESPONSABLE_AEP', 'RESPONSABLE_ASSEU'), dossierController.updateDossierStatus);

// PUT ajout documents (FormData)
router.put('/:id/documents', authenticate, authorize('CLIENT'), upload.array('documents'), dossierController.updateDossierWithFiles);

// GET dossiers par type de demande
router.get('/by-type/:type', authenticate, dossierController.getDossiersByTypeDemande);

// GET un dossier par ID
router.get('/:id', authenticate, dossierController.getDossierById);

module.exports = router;

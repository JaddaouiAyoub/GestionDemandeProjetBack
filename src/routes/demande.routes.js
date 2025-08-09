const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demande.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Un seul endpoint pour créer une demande avec fichiers
router.post(
  '/',
  authenticate,
  authorize('CLIENT'),
  upload.array('documents'), // "documents" = nom du champ dans FormData
  demandeController.createDemandeWithFiles
);

router.get(
  '/mes-demandes',
  authenticate,
  authorize('CLIENT'),
  demandeController.getClientDemandes
);

router.get(
  '/par-type/:type',
  authenticate,
  authorize('RESPONSABLE_AEP','RESPONSABLE_ASSEU','DIRECTEUR'),
  demandeController.getDemandesByType
);

router.get('/:id',
  authenticate,
  demandeController.getDemandeById);

router.put(
  '/:id/status',
  authenticate,
  authorize('RESPONSABLE_AEP','RESPONSABLE_ASSEU'),
  demandeController.updateDemandeStatus
);
router.put('/:id/documents', authenticate, upload.array('documents'), demandeController.updateDemandeDocuments);



module.exports = router;

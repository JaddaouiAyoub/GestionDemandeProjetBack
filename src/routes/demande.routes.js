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
module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');

// CRUD pour le directeur
router.post('/', authenticate, userController.createUser);
router.get('/',authenticate, userController.getAllUsers);
router.get('/:id',authenticate, userController.getUserById);
router.put('/:id',authenticate, userController.updateUser);
router.delete('/:id',authenticate, userController.deleteUser);

module.exports = router;

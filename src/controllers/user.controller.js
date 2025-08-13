const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// 📌 Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, address } = req.body;

    // Vérifier si email déjà utilisé
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const validRoles = ['CLIENT', 'RESPONSABLE_AEP', 'RESPONSABLE_ASSEU', 'DIRECTEUR'];
    const userRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'CLIENT';

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: userRole,
        phone,
        address,
      },
    });

    res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Lire tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Lire un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, address } = req.body;

    const dataToUpdate = {
      firstName,
      lastName,
      email,
      role,
      phone,
      address,
    };

    // Si un nouveau mot de passe est fourni → le hasher
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: dataToUpdate,
    });

    res.json({ message: 'Utilisateur mis à jour', data: user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.status(500).json({ error: error.message });
  }
};

// 📌 Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.status(500).json({ error: error.message });
  }
};

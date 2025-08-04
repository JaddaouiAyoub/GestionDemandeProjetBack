const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
require('dotenv').config();

exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role, phone, address } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({
      message: 'Un utilisateur avec cet email existe déjà.',
    });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    // Normaliser le rôle en majuscule et vérifier qu'il fait partie de l'enum Role
    const validRoles = ['CLIENT', 'RESPONSABLE_AEP', 'RESPONSABLE_ASSEU', 'DIRECTEUR'];
    const userRole = role && validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'CLIENT';

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashed,
        role: userRole,
        phone,
        address,
      },
    });

    res.status(201).json({ message: 'Utilisateur créé', id: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Email ou mot de passe invalide' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: 'Email ou mot de passe invalide' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({ token });
};

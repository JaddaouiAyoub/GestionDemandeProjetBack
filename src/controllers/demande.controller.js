const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.createDemande = async (req, res) => {
  try {
    const { titre, ville, adresse, type, description, remarques } = req.body;
    const user = req.user; // injecté par le middleware authenticate

    if (user.role !== 'CLIENT') {
      return res.status(403).json({ message: 'Seuls les clients peuvent créer des demandes.' });
    }

    // 1. Créer la demande
    const demande = await prisma.demande.create({
      data: {
        titre,
        ville,
        adresse,
        type,
        description,
        remarques,
        client: { connect: { id: user.id } },
      },
    });

    // 2. Créer les documents (s’il y en a)
    const files = req.files; // array of files
    if (files && files.length > 0) {
      const documentData = files.map(file => ({
        filename: file.originalname,
        path: file.path,
        demandeId: demande.id,
      }));

      await prisma.document.createMany({ data: documentData });
    }

    return res.status(201).json({ message: 'Demande créée avec succès', demandeId: demande.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur lors de la création de la demande.' });
  }
};
exports.createDemandeWithFiles = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'CLIENT') {
      return res.status(403).json({ message: 'Seuls les clients peuvent créer des demandes.' });
    }

    const {
      titre,
      ville,
      adresse,
      type,
      description,
      remarques
    } = req.body;

    const demande = await prisma.demande.create({
      data: {
        titre,
        ville,
        adresse,
        type,
        description,
        remarques,
        client: { connect: { id: user.id } },
        documents: {
          create: req.files.map(file => ({
            filename: file.originalname,
            path: file.path.replace(/\\/g, '/'), // sécurité sur Windows
          })),
        },
      },
      include: {
        documents: true,
      },
    });

    res.status(201).json({ success: true, data: demande });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la demande.' });
  }
};

exports.getClientDemandes = async (req, res) => {
  try {
    const clientId = req.user.id;

    const demandes = await prisma.demande.findMany({
      where: { clientId },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: demandes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des demandes.' });
  }
};

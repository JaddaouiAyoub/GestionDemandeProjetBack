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

// GET /demandes/by-type/:type

exports.getDemandesByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['AEP', 'ASSEU', 'LES_DEUX'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type invalide.' });
    }

    // Types à inclure dans la recherche
    let typesToFind = [];
    if (type === 'AEP' || type === 'ASSEU') {
      typesToFind = [type, 'LES_DEUX'];
    } else if (type === 'LES_DEUX') {
      typesToFind = ['LES_DEUX'];
    }

    const demandes = await prisma.demande.findMany({
      where: {
        type: { in: typesToFind }
      },
      // include: {
      //   client: true,
      //   documents: true
      // },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ success: true, data: demandes });
  } catch (error) {
    console.error('Erreur getDemandesByType:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getDemandeById = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        documents: true
      }
    });

    if (!demande) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée.' });
    }

    res.status(200).json({ success: true, data: demande });
  } catch (error) {
    console.error('Erreur getDemandeById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.updateDemandeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarques } = req.body;

    const allowedStatuses = ['ACCEPTEE', 'DOCUMENT_MANQUANT', 'EN_ETUDE', 'A_CORRIGER', 'REFUSEE'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    const updatedDemande = await prisma.demande.update({
      where: { id: parseInt(id) },
      data: {
        status,
        remarques: remarques || '', // facultatif
      },
      include: {
        client: true,
        documents: true
      }
    });

    res.status(200).json({ success: true, data: updatedDemande });
  } catch (error) {
    console.error('Erreur updateDemandeStatus:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

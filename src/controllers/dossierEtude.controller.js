const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Récupérer tous les dossiers d’un client connecté
exports.getClientDossiers = async (req, res) => {
  try {
    const clientId = req.user.id;

    const dossiers = await prisma.dossierEtude.findMany({
      where: { clientId },
      include: {
        demande: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: dossiers });
  } catch (error) {
    console.error('Erreur getClientDossiers:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des dossiers.' });
  }
};

// 2. Modifier le statut d’un dossier d’étude
exports.updateDossierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarques } = req.body;

    const allowedStatuses = ['EN_COURS', 'ACCEPTEE', 'A_CORRIGER'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    const dossier = await prisma.dossierEtude.update({
      where: { id: parseInt(id) },
      data: {
        status,
        remarques: remarques || '',
      },
      // include: {
      //     demande: true,
      //     client: true,
      //     documents: true,
      //   }
    });
    // Si la demande est acceptée, créer un DossierEtude associé
    if (status === 'ACCEPTEE') {
      await prisma.dossierExecution.create({
        data: {
          demandeId: dossier.demandeId,
          clientId: dossier.clientId,
          // createdAt est rempli automatiquement par Prisma
        },
        
      });
    }

    res.status(200).json({ success: true, data: dossier });
  } catch (error) {
    console.error('Erreur updateDossierStatus:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.updateDossierWithFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const dossier = await prisma.dossierEtude.findUnique({
      where: { id: parseInt(id) },
    });

    if (!dossier || dossier.clientId !== user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à ce dossier.' });
    }

    const files = req.files; // fichiers reçus
    const labels = req.body.labels; // labels reçus (array ou string)

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    // Assure que labels est un tableau
    const labelsArray = Array.isArray(labels) ? labels : [labels];

    if (labelsArray.length !== files.length) {
      return res.status(400).json({ message: 'Nombre de labels et fichiers non cohérent.' });
    }

    const documentData = files.map((file, index) => ({
      filename: file.originalname,
      path: file.path.replace(/\\/g, '/'),
      label: labelsArray[index],
      demandeId: dossier.demandeId,
      dossierEtudeId: dossier.id
    }));

    await prisma.document.createMany({ data: documentData });

    const updatedDossier = await prisma.dossierEtude.findUnique({
      where: { id: dossier.id },
      include: {
        documents: true,
        demande: true,
      },
    });

    res.status(200).json({ success: true, message: 'Documents ajoutés avec succès.', data: updatedDossier });
  } catch (error) {
    console.error('Erreur updateDossierWithFiles:', error);
    res.status(500).json({ message: 'Erreur lors de l’ajout des documents au dossier.' });
  }
};


// 4. Récupérer les dossiers d’étude selon le type de demande (AEP, ASSEU, LES_DEUX)
exports.getDossiersByTypeDemande = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['AEP', 'ASSEU', 'LES_DEUX'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type de demande invalide.' });
    }

    // On cherche les dossiers dont la demande est de ce type (ou LES_DEUX si applicable)
    let typesToFind = [];
    if (type === 'AEP' || type === 'ASSEU') {
      typesToFind = [type, 'LES_DEUX'];
    } else {
      typesToFind = ['LES_DEUX'];
    }

    const dossiers = await prisma.dossierEtude.findMany({
      where: {
        demande: {
          type: { in: typesToFind }
        }
      },
      include: {
        demande: true,
        client: true,
        documents: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ success: true, data: dossiers });
  } catch (error) {
    console.error('Erreur getDossiersByTypeDemande:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// 5. Récupérer un dossier d’étude par ID
exports.getDossierById = async (req, res) => {
  try {
    const { id } = req.params;

    const dossier = await prisma.dossierEtude.findUnique({
      where: { id: parseInt(id) },
      include: {
        demande: true,
        client: true,
        documents: true,
      }
    });

    if (!dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé.' });
    }

    res.status(200).json({ success: true, data: dossier });
  } catch (error) {
    console.error('Erreur getDossierById:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du dossier.' });
  }
};

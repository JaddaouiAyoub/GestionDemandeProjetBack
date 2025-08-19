const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Récupérer tous les dossiers d’un client connecté
exports.getClientDossiers = async (req, res) => {
  try {
    const clientId = req.user.id;

    const dossiers = await prisma.dossierExecution.findMany({
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

// 2. Modifier le statut d’un dossier d’étude avec gestion du type LES_DEUX
exports.updateDossierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarques } = req.body;
    const user = req.user; // injecté par middleware auth (contient role/responsable)

    const allowedStatuses = ['EN_COURS', 'ACCEPTEE', 'A_CORRIGER'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    // On récupère le dossier et sa demande
    const dossier = await prisma.dossierExecution.findUnique({
      where: { id: parseInt(id) },
      include: { demande: true }
    });

    if (!dossier) {
      return res.status(404).json({ success: false, message: 'Dossier introuvable.' });
    }

    let newStatus = status;

    // ⚡ Cas particulier : demande LES_DEUX
    if (dossier.demande.type === "LES_DEUX" && status === "ACCEPTEE") {
      if (user.role === "RESP_AEP") {
        newStatus = "ACCEPTEE_AEP";
      } else if (user.role === "RESP_ASSEU") {
        newStatus = "ACCEPTEE_ASSEU";
      }
    }

    // Mise à jour du dossier
    const updated = await prisma.dossierExecution.update({
      where: { id: dossier.id },
      data: {
        status: newStatus,
        remarques: remarques || ''
      }
    });

    // ⚡ Vérification si on peut passer en ACCEPTEE finale
    if (dossier.demande.type === "LES_DEUX") {
      const dossierCheck = await prisma.dossierExecution.findUnique({
        where: { id: dossier.id }
      });

      if (
        dossierCheck.status === "ACCEPTEE_AEP" ||
        dossierCheck.status === "ACCEPTEE_ASSEU"
      ) {
        // On attend l’autre validation
        return res.status(200).json({
          success: true,
          message: "Validation partielle enregistrée. En attente de l’autre responsable.",
          data: dossierCheck
        });
      }

      if (
        dossierCheck.status === "ACCEPTEE_AEP" &&
        newStatus === "ACCEPTEE_ASSEU" ||
        dossierCheck.status === "ACCEPTEE_ASSEU" &&
        newStatus === "ACCEPTEE_AEP"
      ) {
        // Si les deux sont validés, on met ACCEPTEE finale
        const finalDossier = await prisma.dossierExecution.update({
          where: { id: dossier.id },
          data: { status: "ACCEPTEE" }
        });
        return res.status(200).json({
          success: true,
          message: "Dossier validé par AEP et ASSEU. Statut final : ACCEPTEE.",
          data: finalDossier
        });
      }
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Erreur updateDossierStatus:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


exports.updateDossierWithFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const dossier = await prisma.dossierExecution.findUnique({
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
      dossierExecutionId: dossier.id
    }));

    await prisma.document.createMany({ data: documentData });

    const updatedDossier = await prisma.dossierExecution.findUnique({
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

    const dossiers = await prisma.dossierExecution.findMany({
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

    const dossier = await prisma.dossierExecution.findUnique({
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

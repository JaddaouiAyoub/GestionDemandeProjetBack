const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /visites/by-type/:type
 */
exports.getVisitesByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['AEP', 'ASSEU', 'LES_DEUX'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type invalide.' });
    }

    let typesToFind = [];
    if (type === 'AEP' || type === 'ASSEU') {
      typesToFind = [type, 'LES_DEUX'];
    } else {
      typesToFind = ['LES_DEUX'];
    }

    const visites = await prisma.visite.findMany({
      where: {
        dossierExecution: {
          demande: {
            type: { in: typesToFind }
          }
        }
      },
      include: {
        responsable: true,
        dossierExecution: {
          include: {
            demande: { include: { client: true } }
          }
        },
        document: true
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({ success: true, data: visites });
  } catch (error) {
    console.error('Erreur getVisitesByType:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * GET /visites/:id
 */
exports.getVisiteById = async (req, res) => {
  try {
    const { id } = req.params;

    const visite = await prisma.visite.findUnique({
      where: { id: parseInt(id) },
      include: {
        responsable: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        dossierExecution: {
          include: {
            demande: {
              select: {
                id: true,
                titre: true,
                description: true,
                type: true,
                
              }
            }
          }
        },
        document: {
          select: { id: true, filename: true, path: true, label: true }
        }
      }
    });

    if (!visite) {
      return res.status(404).json({ success: false, message: 'Visite introuvable.' });
    }

    res.status(200).json({ success: true, data: visite });
  } catch (error) {
    console.error('Erreur getVisiteById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};




/**
 * GET /visites/by-client/:clientId
 */
exports.getVisitesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const visites = await prisma.visite.findMany({
      where: {
        dossierExecution: {
          demande: { clientId: parseInt(clientId) }
        },
      },
      include: {
        responsable: true,
        dossierExecution: { include: { demande: true } },
        document: true
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({ success: true, data: visites });
  } catch (error) {
    console.error('Erreur getVisitesByClient:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * POST /visites
 */
exports.createVisite = async (req, res) => {
  try {
    const user = req.user; // Injecté par middleware authenticate
    const { date, remarques, responsableId, dossierExecutionId , typeVisite } = req.body;

    console.log('createVisite - user:', typeVisite);
    // Seuls certains rôles peuvent créer des visites
    // if (!['ADMIN', 'TECHNICIEN'].includes(user.role)) {
    //   return res.status(403).json({ success: false, message: 'Non autorisé.' });
    // }

    const visite = await prisma.visite.create({
      data: {
        date: new Date(date),
        remarques,
        responsableId: parseInt(responsableId),
        dossierExecutionId: parseInt(dossierExecutionId),
        typeVisite:typeVisite , // Par défaut AEP si non spécifié
        ...(req.file && {
          document: {
            create: {
              filename: req.file.originalname,
              path: req.file.path.replace(/\\/g, '/'),
              label: 'Document de visite'
            }
          }
        })
      },
      include: { document: true }
    });

    res.status(201).json({ success: true, data: visite });
  } catch (error) {
    console.error('Erreur createVisite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * PUT /visites/:id
 */
exports.updateVisite = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, remarques, responsableId, dossierExecutionId } = req.body;

    const visite = await prisma.visite.update({
      where: { id: parseInt(id) },
      data: {
        date: date ? new Date(date) : undefined,
        remarques,
        responsableId: responsableId ? parseInt(responsableId) : undefined,
        dossierExecutionId: dossierExecutionId ? parseInt(dossierExecutionId) : undefined
      }
    });

    res.status(200).json({ success: true, data: visite });
  } catch (error) {
    console.error('Erreur updateVisite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * DELETE /visites/:id
 */
exports.deleteVisite = async (req, res) => {
  try {
    const { id } = req.params;

    const visite = await prisma.visite.findUnique({
      where: { id: parseInt(id) },
      include: { document: true }
    });

    if (!visite) {
      return res.status(404).json({ success: false, message: 'Visite introuvable.' });
    }

    if (visite.document) {
      await prisma.document.delete({ where: { id: visite.document.id } });
    }

    await prisma.visite.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ success: true, message: 'Visite supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur deleteVisite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

const prisma = require('../config/prisma');

// Fonction récursive pour convertir tous les BigInt en Number dans un objet ou tableau
function convertBigIntToNumber(input) {
  if (Array.isArray(input)) {
    return input.map(convertBigIntToNumber);
  } else if (input !== null && typeof input === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'bigint') {
        newObj[key] = Number(value);
      } else if (typeof value === 'object') {
        newObj[key] = convertBigIntToNumber(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }
  return input;
}

exports.getDashboardStats = async (req, res) => {
  try {
    // --- Comptages simples ---
    const usersCount = await prisma.user.count();
    const demandesCount = await prisma.demande.count();
    const dossiersEtudeCount = await prisma.dossierEtude.count();
    const dossiersExecutionCount = await prisma.dossierExecution.count();

    // --- Taux d'acceptation ---
    const acceptedCount = await prisma.demande.count({
      where: { status: 'ACCEPTEE' }
    });

    const tauxAcceptation =
      demandesCount > 0
        ? ((acceptedCount / demandesCount) * 100).toFixed(2)
        : 0;

    // --- Graphique : demandes par mois ---
    const demandesParMois = await prisma.$queryRaw`
      SELECT 
        MONTH(createdAt) AS mois, 
        COUNT(*) AS total
      FROM Demande
      GROUP BY mois
      ORDER BY mois
    `;

    // --- Graphique : demandes par type ---
    const demandesParType = await prisma.demande.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    // Convertir les BigInt (dans demandesParMois et demandesParType)
    const safeDemandesParMois = convertBigIntToNumber(demandesParMois);
    const safeDemandesParType = convertBigIntToNumber(demandesParType);

    // --- Réponse ---
    res.json({
      stats: {
        usersCount,
        demandesCount,
        dossiersEtudeCount,
        dossiersExecutionCount,
        tauxAcceptation
      },
      charts: {
        demandesParMois: safeDemandesParMois,
        demandesParType: safeDemandesParType
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques :', error);
    res.status(500).json({ error: error.message });
  }
};

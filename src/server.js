const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors')
const authRoutes = require('./routes/auth.routes');
const demandeRoutes = require('./routes/demande.routes');
const dossierEtudeRoutes = require('./routes/dossierEtude.routes');
const dossierExecutionRoutes = require('./routes/dossierExecution.routes');
const userRoutes = require('./routes/user.routes');
const statsRoutes = require('./routes/stats.routes');
const visiteRoutes = require('./routes/visite.routes');

const path = require('path')
app.use(cors()) // autorise toutes les origines
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/dossierEtude',dossierEtudeRoutes);
app.use('/api/dossierExecution',dossierExecutionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/visites', visiteRoutes);
// 🔥 Ligne à ajouter pour servir le dossier uploads correctement
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));

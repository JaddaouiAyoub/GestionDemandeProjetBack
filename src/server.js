const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors')
const authRoutes = require('./routes/auth.routes');
const demandeRoutes = require('./routes/demande.routes');
app.use(cors()) // autorise toutes les origines
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandeRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));

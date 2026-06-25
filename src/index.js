require('dotenv').config(); // NOUVEAU : On charge le coffre-fort .env
const express = require('express');
const connectDB = require('./config/db'); //NOUVEAU : On importe notre câble de connexion

const app = express();
const PORT = process.env.PORT || 3001; 

app.use(express.json());

// --- NOUVELLES LIGNES À AJOUTER ICI ---
const userProfileRoutes = require('./routes/userProfile.routes');
const notificationRoutes = require('./routes/notification.routes');
app.use('/api/users/profile', userProfileRoutes);
app.use('/api/users/notifications', notificationRoutes);

app.get('/api/users/health', (req, res) => {
  res.status(200).json({ message: "Le User Service est en pleine forme ! 🟢" });
});

// NOUVEAU : On branche la BDD, et SEULEMENT SI ça marche, on allume le serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Service User démarré sur http://localhost:${PORT}`);
  });
});
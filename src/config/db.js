const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // On essaie de se connecter avec l'adresse secrète du .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connecté à la base de données MongoDB (User Service)');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB :', error);
    process.exit(1); // Si ça rate, on coupe le serveur pour éviter les bugs
  }
};

module.exports = connectDB;
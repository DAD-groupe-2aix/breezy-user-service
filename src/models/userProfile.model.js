const mongoose = require('mongoose');

// On définit la forme de notre "fiche élève"
const userProfileSchema = new mongoose.Schema({
  // 1. Le lien avec le gardien (l'ID généré par PostgreSQL de ton collègue)
  authId: {
    type: Number, // Ton collègue a utilisé des ID en nombres (1, 2, 3...)
    required: true,
    unique: true
  },
  
// À ajouter dans ton schéma utilisateur existant :
role: {
  type: String,
  enum: ['user', 'moderator', 'admin'],
  default: 'user' // Par défaut, tout le monde est un utilisateur normal
},
status: {
  type: String,
  enum: ['active', 'suspended', 'banned'],
  default: 'active' // Par défaut, le compte est actif
},

  // 2. Les infos publiques (nom, bio, photo)
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  bio: {
    type: String,
    default: "Bonjour, je suis nouveau sur Breezy !"
  },
  profilePicture: {
    type: String,
    default: "default-avatar.png"
  },

  // 3. Le système d'abonnement (qui suit qui)
  followers: [{
    type: Number // On liste les authId des gens qui s'abonnent à lui
  }],
  following: [{
    type: Number // On liste les authId des gens qu'il suit
  }]

}, {
  timestamps: true // Pratique : MongoDB notera tout seul la date de création
});

// On exporte le modèle pour l'utiliser ailleurs
module.exports = mongoose.model('UserProfile', userProfileSchema);
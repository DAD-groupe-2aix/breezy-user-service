// On importe notre modèle (la fiche vide)
const UserProfile = require('../models/userProfile.model');

// On crée la fonction pour enregistrer un profil
exports.createProfile = async (req, res) => {
  try {
    // 1. On récupère les infos envoyées par l'utilisateur
    const { authId, username } = req.body;

    // 2. On remplit une nouvelle fiche
    const newProfile = new UserProfile({
      authId: authId,
      username: username
    });

    // 3. On range la fiche dans le tiroir MongoDB
    await newProfile.save();

    // 4. On répond que tout s'est bien passé (Code 201 = Créé)
    res.status(201).json({ message: "Profil créé avec succès !", profile: newProfile });

  } catch (error) {
    // S'il y a un problème (ex: le nom existe déjà), on renvoie une erreur
    res.status(400).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// On crée la fonction pour récupérer un profil existant
exports.getProfile = async (req, res) => {
  try {
    // 1. On regarde dans l'URL quel ID a été demandé (ex: /api/users/profile/42)
    const idDemande = req.params.authId;

    // 2. On cherche dans le tiroir MongoDB la fiche qui correspond
    const profile = await UserProfile.findOne({ authId: idDemande });

    // 3. Si MongoDB ne trouve rien, on renvoie une erreur 404 (Introuvable)
    if (!profile) {
      return res.status(404).json({ message: "Oups, profil introuvable !" });
    }

    // 4. Si on le trouve, on renvoie la fiche (Code 200 = Succès)
    res.status(200).json(profile);

  } catch (error) {
    // S'il y a un gros bug technique, on renvoie une erreur 500
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// --- NOUVELLE FONCTION ---
// On crée la fonction pour mettre à jour un profil
exports.updateProfile = async (req, res) => {
  try {
    // 1. On regarde dans l'URL quel ID on veut modifier
    const idDemande = req.params.authId;
    
    // 2. On récupère les nouvelles informations envoyées (la nouvelle bio, etc.)
    const modifications = req.body;

    // 3. On demande à MongoDB de trouver la fiche et de la remplacer avec les nouveautés
    const profileMisAJour = await UserProfile.findOneAndUpdate(
      { authId: idDemande }, // La condition de recherche
      modifications,         // Les nouvelles données
      { new: true }          // L'option magique : on demande à MongoDB de nous renvoyer la fiche mise à jour (pas l'ancienne)
    );

    // 4. Si on ne trouve pas le profil
    if (!profileMisAJour) {
      return res.status(404).json({ message: "Profil introuvable !" });
    }

    // 5. Tout s'est bien passé
    res.status(200).json({ 
      message: "Profil mis à jour avec succès !", 
      profile: profileMisAJour 
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// --- NOUVELLE FONCTION (Celle que tu as anticipée !) ---
// On crée la fonction pour supprimer définitivement un profil
exports.deleteProfile = async (req, res) => {
  try {
    // 1. On regarde dans l'URL quel ID on veut supprimer
    const idDemande = req.params.authId;

    // 2. On demande à MongoDB de trouver la fiche et de la jeter à la poubelle
    const profileSupprime = await UserProfile.findOneAndDelete({ authId: idDemande });

    // 3. Si on ne trouve pas le profil
    if (!profileSupprime) {
      return res.status(404).json({ message: "Profil introuvable, il est peut-être déjà supprimé !" });
    }

    // 4. Tout s'est bien passé
    res.status(200).json({ message: "Profil supprimé avec succès" });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

// --- FONCTIONNALITÉS SOCIALES ---

// Fonction pour s'abonner à un utilisateur
exports.followUser = async (req, res) => {
  try {
    // L'ID de l'utilisateur cible (celui qu'on veut suivre) est dans l'URL
    const targetId = parseInt(req.params.targetId);
    
    // L'ID de l'utilisateur qui fait l'action (qui clique sur le bouton "Follow")
    // Note: Plus tard, cet ID viendra du token de sécurité. Pour le moment, on l'envoie dans le body.
    const followerId = parseInt(req.body.followerId);

    if (followerId === targetId) {
      return res.status(400).json({ message: "Vous ne pouvez pas vous abonner à vous-même." });
    }

    // 1. On ajoute le followerId dans le tableau 'followers' de la cible
    const targetUser = await UserProfile.findOneAndUpdate(
      { authId: targetId },
      { $addToSet: { followers: followerId } },
      { new: true }
    );

    if (!targetUser) {
      return res.status(404).json({ message: "Utilisateur cible introuvable." });
    }

    // 2. On ajoute le targetId dans le tableau 'following' de l'utilisateur actif
    await UserProfile.findOneAndUpdate(
      { authId: followerId },
      { $addToSet: { following: targetId } }
    );

    res.status(200).json({ message: `Vous êtes maintenant abonné à l'utilisateur ${targetId}.` });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'abonnement.", error: error.message });
  }
};

// Fonction pour se désabonner d'un utilisateur
exports.unfollowUser = async (req, res) => {
  try {
    const targetId = parseInt(req.params.targetId);
    const followerId = parseInt(req.body.followerId);

    // 1. On retire le followerId du tableau 'followers' de la cible
    const targetUser = await UserProfile.findOneAndUpdate(
      { authId: targetId },
      { $pull: { followers: followerId } },
      { new: true }
    );

    if (!targetUser) {
      return res.status(404).json({ message: "Utilisateur cible introuvable." });
    }

    // 2. On retire le targetId du tableau 'following' de l'utilisateur actif
    await UserProfile.findOneAndUpdate(
      { authId: followerId },
      { $pull: { following: targetId } }
    );

    res.status(200).json({ message: `Vous vous êtes désabonné de l'utilisateur ${targetId}.` });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors du désabonnement.", error: error.message });
  }
};
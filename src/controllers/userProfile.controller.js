const UserProfile = require('../models/userProfile.model');
const Notification = require('../models/notification.model');

exports.createProfile = async (req, res) => {
  try {
    // 1. On récupère les infos envoyées par l'utilisateur
    const { authId, username, birthdate, profilePicture } = req.body;

    // 2. On remplit une nouvelle fiche
    const newProfile = new UserProfile({
      authId,
      username,
      ...(birthdate ? { birthdate } : {}),
      ...(profilePicture ? { profilePicture } : {}),
    });

    // 3. On range la fiche dans le tiroir MongoDB
    await newProfile.save();

    // 4. On répond que tout s'est bien passé (Code 201 = Créé)
    res.status(201).json({ message: "Profil créé avec succès !", profile: newProfile });

  } catch (error) {
    // Pseudo déjà pris (contrainte d'unicité MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({ message: field === 'username' ? "Ce pseudo est déjà pris." : "Ce compte existe déjà." });
    }
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

// On cherche un profil par son pseudo (utilisé par auth-service pour la connexion par pseudo)
exports.getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await UserProfile.findOne({ username });
    if (!profile) {
      return res.status(404).json({ message: "Profil introuvable." });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    // 1. On regarde dans l'URL quel ID on veut modifier
    const idDemande = req.params.authId;

    // 2. On ne garde que les champs autorisés (jamais role/status/followers via cette route générique)
    const { username, bio, profilePicture, birthdate } = req.body;
    const modifications = {};
    if (username !== undefined) modifications.username = username;
    if (bio !== undefined) modifications.bio = bio;
    if (profilePicture !== undefined) modifications.profilePicture = profilePicture;
    if (birthdate !== undefined) modifications.birthdate = birthdate;

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
    if (error.code === 11000) {
      return res.status(409).json({ message: "Ce pseudo est déjà pris." });
    }
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
    const followerId = parseInt(req.body.authId);

    if (Number.isNaN(targetId) || Number.isNaN(followerId)) {
      return res.status(400).json({ message: "authId requis dans le body et targetId valide dans l'URL." });
    }

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

    Notification.create({ recipientId: targetId, senderId: followerId, type: 'follow' }).catch(() => {});

    res.status(200).json({ message: `Vous êtes maintenant abonné à l'utilisateur ${targetId}.` });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'abonnement.", error: error.message });
  }
};

// Fonction pour se désabonner d'un utilisateur
exports.unfollowUser = async (req, res) => {
  try {
    const targetId = parseInt(req.params.targetId);
    const followerId = parseInt(req.body.authId);

    if (Number.isNaN(targetId) || Number.isNaN(followerId)) {
      return res.status(400).json({ message: "authId requis dans le body et targetId valide dans l'URL." });
    }

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

// Lister tous les profils (réservé aux modérateurs/admins, pour le panel admin)
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await UserProfile.find().sort({ authId: 1 });
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des profils.", error: error.message });
  }
};

// Fx21. Modifier le statut d'un utilisateur (Modération : activer, suspendre, bannir)
exports.updateUserStatus = async (req, res) => {
  try {
    const { authId } = req.params; // L'ID de l'utilisateur à modérer
    const { status } = req.body;   // Le nouveau statut ('active', 'suspended', 'banned')

    // Validation du statut envoyé
    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut de modération invalide." });
    }

    // On cherche l'utilisateur par son authId et on met à jour son statut
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { authId: authId },
      { status: status },
      { new: true } // Pour renvoyer le profil mis à jour
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    res.status(200).json({
      message: `Le statut de l'utilisateur a été modifié avec succès : ${status}`,
      profile: updatedProfile
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification du statut.", error: error.message });
  }
};
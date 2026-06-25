const Notification = require('../models/notification.model');
const UserProfile = require('../models/userProfile.model');

exports.createNotif = async (req, res) => {
  try {
    const { recipientId, senderId, type, postId } = req.body;

    if (!recipientId || !senderId || !type) {
      return res.status(400).json({ message: 'Champs requis manquants.' });
    }

    if (recipientId === senderId) return res.status(200).json({ skipped: true });

    // Pour les likes : éviter les doublons (un seul like notif par post/user)
    if (type === 'like' && postId) {
      const existing = await Notification.findOne({ recipientId, senderId, type: 'like', postId });
      if (existing) return res.status(200).json({ skipped: true });
    }

    const notif = await Notification.create({ recipientId, senderId, type, postId: postId ?? null });
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Erreur création notification.', error: error.message });
  }
};

exports.getUserNotifs = async (req, res) => {
  try {
    const recipientId = parseInt(req.params.userId);
    const notifs = await Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(50);

    const senderIds = [...new Set(notifs.map((n) => n.senderId))];
    const profiles = await UserProfile.find({ authId: { $in: senderIds } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.authId, p]));

    const result = notifs.map((n) => {
      const sender = profileMap[n.senderId];
      return {
        id: n._id,
        type: n.type,
        postId: n.postId,
        read: n.read,
        createdAt: n.createdAt,
        sender: {
          id: n.senderId,
          username: sender?.username ?? `user_${n.senderId}`,
          avatar: sender?.profilePicture && sender.profilePicture !== 'default-avatar.png'
            ? sender.profilePicture
            : null,
        },
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération notifications.', error: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const recipientId = parseInt(req.params.userId);
    await Notification.updateMany({ recipientId, read: false }, { read: true });
    res.status(200).json({ message: 'Notifications marquées comme lues.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour notifications.', error: error.message });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (!roles.includes(role)) {
    return res.status(403).json({ message: "Action réservée aux modérateurs et administrateurs." });
  }
  next();
};

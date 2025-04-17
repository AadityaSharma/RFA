const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization;
    if (!hdr || !hdr.startsWith('Bearer '))
      throw { status: 401, message: 'Not logged in' };
    const token = hdr.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) throw { status: 401, message: 'User not found' };
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return next({ status: 403, message: 'Forbidden' });
  next();
};
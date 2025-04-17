// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) throw { status: 400, message: 'Missing fields' };
    if (await User.findOne({ email })) throw { status: 400, message: 'Email in use' };
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });
    const token = signToken(user);
    res.status(201).json({ user: { id: user._id, name, email, role }, token });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw { status: 401, message: 'Invalid credentials' };
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw { status: 401, message: 'Invalid credentials' };
    const token = signToken(user);
    res.json({ user: { id: user._id, name: user.name, email, role: user.role }, token });
  } catch (err) { next(err); }
};
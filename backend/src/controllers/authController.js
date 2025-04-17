const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) throw { status: 400, message: 'Missing fields' };
    if (await User.findOne({ email })) throw { status: 400, message: 'Email in use' };
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ token: signToken(user), user: { id: user._id, name, email, role } });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw { status: 401, message: 'Invalid credentials' };
    if (!await bcrypt.compare(password, user.passwordHash))
      throw { status: 401, message: 'Invalid credentials' };
    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
};
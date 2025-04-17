const r = require('express').Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const { newFY } = require('../controllers/adminController');
const upload = multer({ dest: 'uploads/' });

r.post('/newfy', protect, restrictTo('admin'), upload.single('file'), newFY);

module.exports = r;
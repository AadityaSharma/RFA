const r = require('express').Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const ctrl = require('../controllers/actualController');
const upload = multer({ dest: 'uploads/' });

r.post('/import', protect, restrictTo('admin'), upload.single('file'), ctrl.import);
r.get('/', protect, ctrl.list);
r.get('/export', protect, restrictTo('admin'), ctrl.export);

module.exports = r;
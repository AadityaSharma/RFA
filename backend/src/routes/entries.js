const r = require('express').Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const ctrl = require('../controllers/entryController');

const upload = multer({ dest: 'uploads/' });

r.get('/', protect, ctrl.list);
r.post('/', protect, restrictTo('manager'), upload.single('snapshot'), ctrl.upsert);

module.exports = r;
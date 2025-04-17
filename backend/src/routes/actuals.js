const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const {
  import: importActuals,
  list,
  exportActuals
} = require('../controllers/actualController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/import', protect, restrictTo('admin'), upload.single('file'), importActuals);
router.get('/',            protect, list);
router.get('/export',      protect, restrictTo('admin'), exportActuals);

module.exports = router;
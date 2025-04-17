// backend/src/routes/actuals.js
/* const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const {
  importActuals,
  listActuals,
  exportActuals
} = require('../controllers/actualController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Admin uploads CSV of actuals
router.post(
  '/import',
  protect,
  restrictTo('admin'),
  upload.single('file'),
  importActuals
);

// Everyone can list
router.get('/', protect, listActuals);

// Admin can export
router.get('/export', protect, restrictTo('admin'), exportActuals);

module.exports = router;
*/

// backend/src/routes/actuals.js
const express = require('express');
const multer  = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const { importActuals } = require('../controllers/actualsController');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post(
  '/import',
  protect,
  restrictTo('admin'),
  upload.single('file'),
  importActuals
);

module.exports = router;
// backend/src/routes/fy.js
const express = require('express');
const multer  = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const { importForecasts }     = require('../controllers/fyController');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post(
  '/import',
  protect,
  restrictTo('admin'),
  upload.single('file'),
  importForecasts
);

module.exports = router;
// backend/src/routes/entries.js
const express = require('express');
const router = express.Router();
const Entry  = require('../models/Entry'); // adjust path if needed
const {
  list,
  upsert,
  getYears,
  exportCSV
} = require('../controllers/entryController');

// 1) GET years list
router.get('/years', getYears);

// 2) GET all entries for a year+type
router.get('/', list);

// 3) POST save bulk entries - upsert an entry (forecast or opportunity or actual)
router.post('/', upsert);

// 4) GET export CSV
router.get('/export', exportCSV);

module.exports = router;
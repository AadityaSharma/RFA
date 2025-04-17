// backend/src/routes/entries.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  list,
  upsert,
  getYears,
  exportCSV
} = require('../controllers/entryController');

const router = express.Router();

router.get('/years', protect, (req,res)=>getYears({...req,query:{...req.query,type:'forecast'}},res)); 
// or you can accept ?type param from client

router.get('/', protect, list);
router.post('/', protect, upsert);

router.get('/export', protect, restrictTo('admin'), exportCSV);

module.exports = router;
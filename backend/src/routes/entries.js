// backend/src/routes/entries.js
/*
const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  list,
  upsert,
  getYears,
  exportCSV
} = require('../controllers/entryController');
import Entry from '../models/Entry.js'; // adjust import to your schema location

const router = express.Router();

router.get('/years', protect, (req,res)=>getYears({...req,query:{...req.query,type:'forecast'}},res)); 
// or you can accept ?type param from client

router.get('/', protect, list);
router.post('/', protect, upsert);

router.get('/export', protect, restrictTo('admin'), exportCSV);

module.exports = router;
*/

// backend/src/routes/entries.js
const express = require('express');
const router = express.Router();
const Entry  = require('../models/Entry'); // adjust path if needed

// 1) GET years list
router.get('/years', async (req, res) => {
  const { type } = req.query; // 'forecast' or 'opportunities'
  try {
    let years = await Entry.distinct('year', { type });
    if (!years.length) {
      const y = new Date().getFullYear();
      years = [y, y + 1];
    }
    res.json({ years });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2) GET all entries for a year+type
router.get('/', async (req, res) => {
  const { type, year } = req.query;
  try {
    const entries = await Entry.find({ type, year: Number(year) }).lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3) POST save bulk entries
/**
 * upsert an entry (forecast or opportunity or actual)
 */
router.post('/', async (req, res) => {
  const data = req.body;

  // pull out _id if it exists
  const { _id, ...rest } = data;

  // build our upsert filter:
  // if client gave us an _id, use it; otherwise use your natural composite key
  const filter = _id
    ? { _id }
    : {
        type: rest.type,
        year: rest.year,
        accountName: rest.accountName,
        projectName: rest.projectName
      };

  // build the update doc, explicitly omitting _id
  const updateDoc = {
    $set: rest,
    // you can also $setOnInsert defaults here
  };

  try {
    const entry = await Entry.findOneAndUpdate(
      filter,
      updateDoc,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    return res.json(entry);
  } catch (err) {
    console.error('upsert entry error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

// 4) GET export CSV
router.get('/export', async (req, res) => {
  const { type, year } = req.query;
  try {
    const docs = await Entry.find({ type, year: Number(year) }).lean();

    // Build header columns
    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const baseCols = [
      'accountName','deliveryManager','projectName','BU','VDE','GDE','account',
      ...months,
      'total','comments'
    ];
    const oppCols = ['probability','status'];
    const fields = type === 'opportunities' ? baseCols.concat(oppCols) : baseCols;

    // CSV header
    const header = fields.map(f => `"${f}"`).join(',') + '\r\n';

    // CSV rows
    const rows = docs.map(doc => {
      return fields.map(f => {
        let v = doc[f];
        // if month field, doc[month] may be nested, adjust if necessary
        return `"${v !== undefined ? v : ''}"`;
      }).join(',');
    }).join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-${year}.csv`);
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
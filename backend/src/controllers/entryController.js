// backend/src/controllers/entryController.js
const Entry = require('../models/Entry');

exports.list = async (req, res) => {
  const { type, year } = req.query;
  try {
    const entries = await Entry.find({ type, year: Number(year) }).lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.upsert = async (req, res) => {
  const { type, year, entries } = req.body;
  if (!type || !year) {
    return res.status(400).json({ message: 'Missing type or year' });
  }
  if (!Array.isArray(entries)) {
    return res.status(400).json({ message: 'Must send { entries: [] }' });
  }

  // validation
  const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e.accountName || !e.accountName.trim()) {
      return res.status(400).json({ message: `Entry ${i+1}: accountName required` });
    }
    if (!e.projectName || !e.projectName.trim()) {
      return res.status(400).json({ message: `Entry ${i+1}: projectName required` });
    }
    for (const m of months) {
      if (typeof e[m] !== 'number' || e[m] < 0) {
        return res.status(400).json({ message: `Entry ${i+1}: ${m} must be a non-negative number` });
      }
    }
  }

  try {
    const ops = entries.map(e => {
      const filter = {
        projectName: e.projectName,
        accountName: e.accountName,
        year,
        type
      };
      const update = { ...e, year, type };
      return {
        updateOne: { filter, update: { $set: update }, upsert: true }
      };
    });
    await Entry.bulkWrite(ops, { ordered: false });
    const saved = await Entry.find({ type, year }).lean();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getYears = async (req, res) => {
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
};

exports.exportCSV = async (req, res) => {
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
};
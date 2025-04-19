// backend/src/controllers/entryController.js
const Entry = require('../models/Entry');

// month fields, same as frontend
const MONTH_KEYS = [
  'Apr','May','Jun','Jul','Aug','Sep',
  'Oct','Nov','Dec','Jan','Feb','Mar'
];

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
  if (!Array.isArray(entries)) {
    return res.status(400).json({ message: 'Must send { entries: [] }' });
  }

  // --- VALIDATION ---
  const errors = [];
  entries.forEach((e, idx) => {
    if (!e.accountName || !e.accountName.trim()) {
      errors.push(`Entry ${idx+1}: accountName is required`);
    }
    if (!e.projectName || !e.projectName.trim()) {
      errors.push(`Entry ${idx+1}: projectName is required`);
    }
    MONTH_KEYS.forEach(month => {
      const v = e[month];
      if (typeof v !== 'number' || v < 0) {
        errors.push(`Entry ${idx+1}: ${month} must be a non-negative number`);
      }
    });
  });
  if (errors.length) {
    return res.status(400).json({ message: errors.join('; ') });
  }

  try {
    // Build bulk ops
    const ops = entries.map(e => {
      const filter = {
        projectName: e.projectName,
        accountName: e.accountName,
        year: Number(year),
        type
      };
      const update = { ...e, year: Number(year), type };
      return {
        updateOne: {
          filter,
          update: { $set: update },
          upsert: true
        }
      };
    });

    // Run with validation
    await Entry.bulkWrite(ops, {
      ordered: false,
      // ensure mongoose schema validators run
      // (requires mongoose >= 4.1.0)
      runValidators: true
    });

    // Return fresh list
    const saved = await Entry.find({ type, year: Number(year) }).lean();
    res.json(saved);
  } catch (err) {
    console.error('Entry upsert error:', err);
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
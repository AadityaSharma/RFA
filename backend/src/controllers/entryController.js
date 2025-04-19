const Entry = require('../models/Entry');

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
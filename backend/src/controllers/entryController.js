// backend/src/controllers/entryController.js
const Entry = require('../models/Entry');

exports.list = async (req, res, next) => {
  try {
    const q = { type: req.query.type };
    if (req.user.role === 'manager') q.managerId = req.user._id;
    if (req.query.year)  q.year  = +req.query.year;
    if (req.query.month) q.month = +req.query.month;
    const entries = await Entry.find(q).lean();
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

exports.upsert = async (req, res, next) => {
  try {
    const { projectId, year, month, type, valueMillion, comment, probability, status } = req.body;
    const data = { projectId, year, month, type, valueMillion, comment, probability, status };
    await Entry.findOneAndUpdate(
      { projectId, year, month, type },
      data,
      { upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getYears = async (req, res, next) => {
  try {
    const years = await Entry.distinct('year', { type: req.query.type });
    years.sort((a,b)=>b-a);
    res.json(years);
  } catch (err) {
    next(err);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const { type, year } = req.query;
    const q = { type };
    if (year) q.year = +year;
    const data = await Entry.find(q)
      .populate('projectId','account name managerName')
      .lean();

    // Build CSV rows grouped by project
    const months = [4,5,6,7,8,9,10,11,12,1,2,3];
    const labels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const rows = {};

    data.forEach(e => {
      const pid = e.projectId._id.toString();
      if (!rows[pid]) {
        rows[pid] = {
          Account: e.projectId.account,
          'Delivery Manager': e.projectId.managerName,
          'Project Name': e.projectId.name
        };
        labels.forEach(l => rows[pid][l]='');
      }
      const i = months.indexOf(e.month);
      rows[pid][labels[i]] = e.valueMillion.toString();
    });

    const out = Object.values(rows);
    if (!out.length) return res.status(204).send();

    const header = Object.keys(out[0]).join(',');
    const lines  = out.map(r => Object.values(r).join(','));
    const csv    = [header, ...lines].join('\n');

    res.setHeader('Content-Disposition', `attachment; filename=${type}_${year||'all'}.csv`);
    res.type('text/csv').send(csv);
  } catch (err) {
    next(err);
  }
};
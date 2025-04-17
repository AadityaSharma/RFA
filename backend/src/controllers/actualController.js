const Actual = require('../models/Actual');
const { parseFile } = require('../utils/csvParser');

exports.import = async (req, res, next) => {
  const rows = await parseFile(req.file.path);
  const docs = rows.map(r => ({
    projectId: r.projectId, year: +r.year, month: +r.month,
    valueMillion: +r.valueMillion, uploadedBy: req.user._id
  }));
  await Actual.deleteMany({}); // remove old for this FY if you wish
  await Actual.insertMany(docs);
  res.json({ imported: docs.length });
};

exports.list = async (req, res, next) => {
  const q = { ...(req.query) };
  const a = await Actual.find(q);
  res.json(a);
};

exports.export = async (req, res, next) => {
  const all = await Actual.find().lean();
  const ws = require('xlsx').utils.json_to_sheet(all);
  const wb = require('xlsx').utils.book_new();
  require('xlsx').utils.book_append_sheet(wb, ws, 'Actuals');
  const buf = require('xlsx').write(wb, { type:'buffer', bookType:'xlsx' });
  res.setHeader('Content-Disposition','attachment; filename=actuals.xlsx');
  res.send(buf);
};
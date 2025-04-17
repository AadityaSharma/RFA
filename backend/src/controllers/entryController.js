const Entry = require('../models/Entry');
const AuditLog = require('../models/AuditLog');

exports.list = async (req, res, next) => {
  const q = { ...(req.query), managerId: req.user.role==='manager' ? req.user._id : undefined };
  const entries = await Entry.find(q);
  res.json(entries);
};

exports.upsert = async (req, res, next) => {
  const { projectId, year, month, type, valueMillion, probability, status } = req.body;
  const snapshotURL = req.file ? `/uploads/${req.file.filename}` : undefined;

  let e = await Entry.findOne({ projectId, managerId: req.user._id, year, month, type });
  if (e) {
    await AuditLog.create({ entryId: e._id, prevValue: e.valueMillion, newValue: valueMillion, changedBy: req.user._id });
    e.valueMillion = valueMillion;
    if (snapshotURL) e.snapshotURL = snapshotURL;
    if (type==='opportunity') {
      e.probability = probability;
      e.status = status;
    }
    await e.save();
  } else {
    e = await Entry.create({
      projectId, managerId: req.user._id, year, month, type,
      valueMillion, snapshotURL, probability, status
    });
  }
  res.json(e);
};
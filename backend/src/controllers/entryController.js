const Entry = require('../models/Entry');
const AuditLog = require('../models/AuditLog');

exports.getYears = async (req, res, next) => {
  try {
    // only return years that have at least one forecast entry
    const years = await Entry.distinct('year', { type: 'forecast' });
    years.sort((a,b)=>b-a);           // descending
    res.json(years);                  // e.g. [2025,2024,2023]
  } catch (err) {
    next(err);
  }
};

exports.list = async (req,res,next) => {
  try {
    const q = { type: req.query.type };
    if (req.user.role === 'manager') q.managerId = req.user._id;
    if (req.query.year)  q.year  = +req.query.year;
    if (req.query.month) q.month = +req.query.month;
    const entries = await Entry.find(q).lean();
    res.json(entries);
  } catch(e){ next(e) }
};

exports.upsert = async (req, res, next) => {
  try {
    const { projectId, year, month, type, valueMillion, probability, status, comment } = req.body;
    const snapshotURL = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Find existing entry
    let e = await Entry.findOne({ projectId, managerId: req.user._id, year, month, type });
    const now = Date.now();

    // Weekly update enforcement
    if (!e) {
      const prev = await Entry.findOne({ projectId, managerId: req.user._id, type })
        .sort({ createdAt: -1 });
      if (prev && (now - prev.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        throw { status: 400, message: 'You can only update once per week' };
      }
    }

    // Create or update
    if (e) {
      await AuditLog.create({
        entryId: e._id,
        prevValue: e.valueMillion,
        newValue: valueMillion,
        changedBy: req.user._id
      });
      e.valueMillion = valueMillion;
      if (snapshotURL) e.snapshotURL = snapshotURL;
      if (type === 'opportunity') {
        e.probability = probability;
        e.status = status;
      }
      e.comment = comment;
      await e.save();
    } else {
      e = await Entry.create({
        projectId, managerId: req.user._id,
        year, month, type,
        valueMillion, snapshotURL,
        probability, status, comment
      });
    }

    res.json(e);
  } catch (e) {
    next(e);
  }
};
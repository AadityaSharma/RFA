const Entry = require('../models/Entry');
const AuditLog = require('../models/AuditLog');

exports.list = async (req, res, next) => {
  const q = { ...req.query };
  if (req.user.role === 'manager') q.managerId = req.user._id;
  const entries = await Entry.find(q);
  res.json(entries);
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
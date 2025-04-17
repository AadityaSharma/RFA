const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry', required: true },
  prevValue: Number,
  newValue: Number,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditSchema);
const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: Number,
  month: Number,
  type: { type: String, enum: ['forecast','opportunity'], required: true },
  valueMillion: Number,
  snapshotURL: String,
  probability: { type: String, enum: ['A','B','C','D','E'], default: null },
  status: { type: String, enum: ['In-progress','Won','Abandoned'], default: 'In-progress' },
  comment: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);
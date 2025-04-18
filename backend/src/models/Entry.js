// backend/src/models/Entry.js
const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  // core identity
  type: {
    type: String,
    enum: ['forecast','opportunity'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },

  // row fields
  accountName:     { type: String, required: true },
  deliveryManager: { type: String, default: '' },
  projectName:     { type: String, default: '' },

  BU:      { type: String, default: '' },
  VDE:     { type: String, default: '' },
  GDE:     { type: String, default: '' },
  account: { type: String, default: '' },

  // months
  Apr: { type: Number, default: 0 },
  May: { type: Number, default: 0 },
  Jun: { type: Number, default: 0 },
  Jul: { type: Number, default: 0 },
  Aug: { type: Number, default: 0 },
  Sep: { type: Number, default: 0 },
  Oct: { type: Number, default: 0 },
  Nov: { type: Number, default: 0 },
  Dec: { type: Number, default: 0 },
  Jan: { type: Number, default: 0 },
  Feb: { type: Number, default: 0 },
  Mar: { type: Number, default: 0 },

  total:    { type: Number, default: 0 },
  comments: { type: String, default: '' },

  // only for opportunities
  probability: { type: String, default: '' },
  status:      { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);
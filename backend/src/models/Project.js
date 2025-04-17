const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  AOPTargets: [{
    year: Number,
    month: Number,
    valueMillion: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
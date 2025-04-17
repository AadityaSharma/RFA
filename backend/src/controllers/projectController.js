const Project = require('../models/Project');

exports.getAll = async (req, res, next) => {
  const projects = await Project.find().populate('managers','name email');
  res.json(projects);
};

exports.create = async (req, res, next) => {
  const p = await Project.create(req.body);
  res.status(201).json(p);
};

exports.assign = async (req, res, next) => {
  const { projectId } = req.params;
  const { managerIds } = req.body;
  const p = await Project.findByIdAndUpdate(projectId,
    { managers: managerIds }, { new: true });
  res.json(p);
};

exports.setAOP = async (req, res, next) => {
  const { projectId } = req.params;
  const { year, month, valueMillion } = req.body;
  const p = await Project.findById(projectId);
  p.AOPTargets.push({ year, month, valueMillion });
  await p.save();
  res.json(p);
};
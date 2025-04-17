const Project = require('../models/Project');
const { parseFile } = require('../utils/csvParser');

exports.newFY = async (req, res, next) => {
  // expects same CSV format as existing export: name,description,managers,...
  const rows = await parseFile(req.file.path);
  // remove old FY's projects if needed, then...
  const proms = rows.map(r => Project.create({
    name: r.name, description: r.description, managers: r.managers.split(',')
  }));
  await Promise.all(proms);
  res.json({ created: rows.length });
};
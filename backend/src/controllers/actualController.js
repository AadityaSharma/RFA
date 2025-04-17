const Actual = require('../models/Actual');
const Project = require('../models/Project');
const { parseFile } = require('../utils/csvParser');

exports.import = async (req, res, next) => {
  try {
    const rows = await parseFile(req.file.path);
    // Map project names to IDs
    const projects = await Project.find().lean();
    const nameToId = {};
    projects.forEach(p => { nameToId[p.name] = p._id; });

    const docs = rows.map(r => {
      if (!nameToId[r.projectName]) {
        throw { status: 400, message: `Unknown project: ${r.projectName}` };
      }
      return {
        projectId: nameToId[r.projectName],
        year: +r.year,
        month: +r.month,
        valueMillion: +r.valueMillion,
        uploadedBy: req.user._id
      };
    });

    // Overwrite existing actuals
    await Actual.deleteMany({});
    await Actual.insertMany(docs);

    res.json({ imported: docs.length });
  } catch (e) {
    next(e);
  }
};
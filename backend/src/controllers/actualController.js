const Actual = require('../models/Actual');
const Entry   = require('../models/Entry');
const Project = require('../models/Project');
const { parseFile } = require('../utils/csvParser');

const xlsx = require('xlsx');

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

/*
exports.exportActuals = async (req, res, next) => {
  try {
    const all = await Actual.find().lean();
    const ws = require('xlsx').utils.json_to_sheet(all);
    const wb = require('xlsx').utils.book_new();
    require('xlsx').utils.book_append_sheet(wb, ws, 'Actuals');
    const buf = require('xlsx').write(wb, { type:'buffer', bookType:'xlsx' });
    res.setHeader('Content-Disposition','attachment; filename=actuals.xlsx');
    res.send(buf);
  } catch (err) {
    next(err);
  }
}; */

exports.importActuals = async (req, res, next) => {
  try {
    const rows = await parseFile(req.file.path);
    // ... your existing CSV‐import logic ...
    res.json({ imported: docs.length });
  } catch (e) {
    next(e);
  }
};

exports.listActuals = async (req, res, next) => {
  try {
    // optional filters by year/month if desired
    const actuals = await Actual.find().lean();
    res.json(actuals);
  } catch (e) {
    next(e);
  }
};

exports.exportActuals = async (req, res, next) => {
  try {
    const all = await Actual.find().lean();
    const ws = xlsx.utils.json_to_sheet(all);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Actuals');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition','attachment; filename=actuals.xlsx');
    res.send(buf);
  } catch (e) {
    next(e);
  }
};

exports.importActuals = async (req, res, next) => {
  try {
    const year = +req.body.year;
    const rows = await parseFile(req.file.path);
    const months = [4,5,6,7,8,9,10,11,12,1,2,3];
    const labels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const mismatches = [];

    for (const r of rows) {
      // must match both account+project
      const proj = await Project.findOne({
        account: r.accountName,
        name:    r.projectName
      });
      if (!proj) {
        mismatches.push(`${r.accountName}/${r.projectName}`);
        continue;
      }
      for (let i = 0; i < 12; i++) {
        const val = parseFloat(r[labels[i]]) || 0;
        await Entry.findOneAndUpdate(
          {
            projectId: proj._id,
            year,
            month: months[i],
            type: 'actual'
          },
          { valueMillion: val },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }

    if (mismatches.length) {
      return res.status(400).json({
        error: 'Some rows did not match any project:',
        details: mismatches
      });
    }
    res.json({ success: true, imported: rows.length });
  }
  catch(err){ next(err) }
};
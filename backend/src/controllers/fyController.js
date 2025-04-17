// backend/src/controllers/fyController.js
const Project = require('../models/Project');
const Entry   = require('../models/Entry');
const { parseFile } = require('../utils/csvParser'); // your existing CSV util

// Import a Forecast CSV for a new FY
exports.importForecasts = async (req, res, next) => {
  try {
    const year = +req.body.year;
    const rows = await parseFile(req.file.path);
    // CSV headers must include:
    // accountName, managerName, projectName, bu,vde,gde,account,
    // Apr,May,…,Mar
    for (const r of rows) {
      // 1) ensure project exists
      let proj = await Project.findOne({
        account: r.accountName,
        name:    r.projectName
      });
      if (!proj) {
        proj = await Project.create({
          account:     r.accountName,
          name:        r.projectName,
          managerName: r.managerName,
          bu:          r.bu,
          vde:         r.vde,
          gde:         r.gde
        });
      }
      // 2) upsert 12 months
      const mm = [4,5,6,7,8,9,10,11,12,1,2,3];
      const labels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
      for (let i = 0; i < 12; i++) {
        const val = parseFloat(r[labels[i]]) || 0;
        await Entry.findOneAndUpdate(
          {
            projectId: proj._id,
            year,
            month: mm[i],
            type: 'forecast'
          },
          { valueMillion: val },
          { upsert: true }
        );
      }
    }
    res.json({ success: true, imported: rows.length });
  } catch (err) {
    next(err);
  }
};
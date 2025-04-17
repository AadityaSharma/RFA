const express = require('express');
const multer = require('multer');
const { Parser } = require('json2csv');
const { protect, restrictTo } = require('../middleware/auth');
const ctrl = require('../controllers/entryController');
const upload = multer({ dest: 'uploads/' });

const { list, upsert, getYears } = require('../controllers/entryController');

const router = express.Router();

// List and upsert as before
router.get('/', protect, ctrl.list);
router.post('/', protect, restrictTo('manager'), upload.single('snapshot'), ctrl.upsert);

// Export entries as CSV
router.get('/export', protect, restrictTo('manager','admin'), async (req, res, next) => {
  try {
    const type = req.query.type;
    const q = { type };
    if (req.user.role === 'manager') q.managerId = req.user._id;
    const entries = await require('../models/Entry').find(q).lean();

    const fields = [
      'projectId','managerId','year','month','type',
      'valueMillion','probability','status','comment','updatedAt'
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(entries);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}.csv`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

router.get('/years', protect, getYears);

module.exports = router;
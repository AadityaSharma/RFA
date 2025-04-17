const r = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth');
const ctrl = require('../controllers/projectController');

r.get('/', protect, ctrl.getAll);
r.post('/', protect, restrictTo('admin'), ctrl.create);
r.put('/:projectId/assign', protect, restrictTo('admin'), ctrl.assign);
r.put('/:projectId/aop', protect, restrictTo('admin'), ctrl.setAOP);

module.exports = r;
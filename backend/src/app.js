const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const entryRoutes = require('./routes/entries');
const actualRoutes = require('./routes/actuals');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./middleware/error');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/actuals', actualRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);
module.exports = app;
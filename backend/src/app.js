const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
// ... add other routers

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
// ...

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status||500).json({ message: err.message });
});

module.exports = app;
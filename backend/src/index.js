// backend/src/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const csv = require('csvtojson');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- MONGOOSE MODELS ---
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true},
  role:{type:String,enum:['admin','manager'],default:'manager'},
  assignedProjects:[{type:mongoose.Schema.Types.ObjectId,ref:'Project'}]
},{timestamps:true});
const User = mongoose.model('User', userSchema);

const projectSchema = new mongoose.Schema({
  name:{type:String,required:true,unique:true},
  description:String,
  managers:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  AOPTargets:[{
    year:Number, month:Number,
    valueMillion:Number
  }]
},{timestamps:true});
const Project = mongoose.model('Project', projectSchema);

const entrySchema = new mongoose.Schema({
  projectId:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true},
  managerId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  year:Number, month:Number,
  type:{type:String,enum:['forecast','opportunity'],required:true},
  valueMillion:Number,
  snapshotURL:String,
  locked:{type:Boolean,default:false}
},{timestamps:true});
const Entry = mongoose.model('Entry', entrySchema);

const actualSchema = new mongoose.Schema({
  projectId:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true},
  year:Number, month:Number,
  valueMillion:Number,
  uploadedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  uploadedAt:{type:Date,default:Date.now}
});
const Actual = mongoose.model('Actual', actualSchema);

const versionSchema = new mongoose.Schema({
  entryId:{type:mongoose.Schema.Types.ObjectId,ref:'Entry',required:true},
  prevValue:Number, newValue:Number,
  changedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  changedAt:{type:Date,default:Date.now},
  snapshotURL:String
});
const Version = mongoose.model('Version', versionSchema);

// --- AUTH HELPERS ---
const signToken = u=> jwt.sign({id:u._id, role:u.role}, process.env.JWT_SECRET, {expiresIn:'7d'});

const protect = async (req,res,next)=>{
  try {
    const h = req.headers.authorization;
    if(!h||!h.startsWith('Bearer ')) throw {status:401,message:'Not logged in'};
    const token = h.split(' ')[1];
    const p = jwt.verify(token,process.env.JWT_SECRET);
    const u = await User.findById(p.id);
    if(!u) throw {status:401,message:'Invalid token'};
    req.user = u; next();
  } catch(e){ next(e); }
};

const restrictTo = (...roles)=>(req,res,next)=>{
  if(!roles.includes(req.user.role)) return next({status:403,message:'Forbidden'});
  next();
};

// --- MULTER FOR FILE UPLOADS ---
const storage = multer.diskStorage({
  destination:(_,__,cb)=> cb(null, path.join(__dirname,'..','uploads')),
  filename:(_,f,cb)=> cb(null, Date.now() + '-' + f.originalname)
});
const upload = multer({storage});

// --- ROUTES ---
// 1) Auth
app.post('/api/auth/signup', async (req,res,next)=>{
  try {
    const {name,email,password,role} = req.body;
    if(!name||!email||!password) throw {status:400,message:'Missing fields'};
    if(await User.findOne({email})) throw {status:400,message:'Email in use'};
    const passwordHash = await bcrypt.hash(password,12);
    const u = await User.create({name,email,passwordHash,role});
    res.status(201).json({user:{id:u._id,name,email,role},token:signToken(u)});
  } catch(e){ next(e); }
});
app.post('/api/auth/login', async (req,res,next)=>{
  try {
    const {email,password} = req.body;
    const u = await User.findOne({email});
    if(!u||!await bcrypt.compare(password,u.passwordHash))
      throw {status:401,message:'Invalid credentials'};
    res.json({user:{id:u._id,name:u.name,email,role:u.role},token:signToken(u)});
  } catch(e){ next(e); }
});

// 2) Projects
app.get('/api/projects', protect, async (req,res,next)=>{
  const ps = await Project.find().populate('managers','name email');
  res.json(ps);
});
app.post('/api/projects', protect, restrictTo('admin'), async (req,res,next)=>{
  const {name,description} = req.body;
  const p = await Project.create({name,description});
  res.status(201).json(p);
});
app.put('/api/projects/:id/assign', protect, restrictTo('admin'), async (req,res,next)=>{
  const {managerIds} = req.body; // array of user _id
  const p = await Project.findByIdAndUpdate(req.params.id,{
    managers:managerIds
  },{new:true});
  res.json(p);
});
app.put('/api/projects/:id/aop', protect, restrictTo('admin'), async (req,res,next)=>{
  const {year,month,valueMillion} = req.body;
  const p = await Project.findById(req.params.id);
  p.AOPTargets.push({year,month,valueMillion});
  await p.save();
  res.json(p);
});

// 3) Entries (forecast & opportunity)
app.get('/api/entries', protect, async (req,res,next)=>{
  // filter by query params
  const q = {};
  ['projectId','managerId','year','month','type'].forEach(k=>{
    if(req.query[k]) q[k]=req.query[k];
  });
  // managers see only their own
  if(req.user.role==='manager') q.managerId = req.user._id;
  const es = await Entry.find(q);
  res.json(es);
});
app.post('/api/entries', protect, restrictTo('manager'), upload.single('snapshot'), async (req,res,next)=>{
  const {projectId,year,month,type,valueMillion} = req.body;
  const snap = req.file ? `/uploads/${req.file.filename}` : null;
  // lock check omitted for brevity
  let e = await Entry.findOne({projectId,managerId:req.user._id,year,month,type});
  if(e){
    // log version
    await Version.create({
      entryId:e._id, prevValue:e.valueMillion,
      newValue:valueMillion, changedBy:req.user._id,
      snapshotURL:snap
    });
    e.valueMillion=valueMillion;
    if(snap) e.snapshotURL=snap;
    await e.save();
  } else {
    e = await Entry.create({
      projectId, managerId:req.user._id,
      year, month, type,
      valueMillion, snapshotURL:snap
    });
  }
  res.json(e);
});
app.get('/api/entries/:id/versions', protect, async (req,res,next)=>{
  const vs = await Version.find({entryId:req.params.id});
  res.json(vs);
});

// 4) Actuals import
app.post('/api/actuals/import', protect, restrictTo('admin'), upload.single('file'), async (req,res,next)=>{
  const filePath = req.file.path;
  let data = [];
  if(req.file.mimetype.includes('sheet')) {
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    data = xlsx.utils.sheet_to_json(ws);
  } else {
    data = await csv().fromFile(filePath);
  }
  // expect columns: projectId,year,month,valueMillion
  const docs = data.map(r=>({
    projectId:r.projectId,year:+r.year,month:+r.month,
    valueMillion:+r.valueMillion, uploadedBy:req.user._id
  }));
  await Actual.insertMany(docs);
  fs.unlinkSync(filePath);
  res.json({ imported: docs.length });
});
app.get('/api/actuals', protect, async (req,res,next)=>{
  const q={}; ['projectId','year','month'].forEach(k=>req.query[k]&&(q[k]=req.query[k]));
  const a = await Actual.find(q);
  res.json(a);
});

// 5) Dashboard summary
app.get('/api/dashboard/summary', protect, async (req,res,next)=>{
  const {projectId,year} = req.query;
  const match = {};
  if(projectId) match.projectId = mongoose.Types.ObjectId(projectId);
  if(year) match.year = +year;
  // group forecasts
  const forecasts = await Entry.aggregate([
    {$match:{...match,type:'forecast'}},
    {$group:{_id:{month:'$month'}, sum:{$sum:'$valueMillion'}}}
  ]);
  const actuals = await Actual.aggregate([
    {$match:match},
    {$group:{_id:{month:'$month'}, sum:{$sum:'$valueMillion'}}}
  ]);
  res.json({forecasts,actuals});
});


// Export Actuals
app.get('/api/actuals/export', protect, restrictTo('admin'), async (req, res, next) => {
  const all = await Actual.find().lean();
  const ws = xlsx.utils.json_to_sheet(all);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Actuals');
  const buf = xlsx.write(wb, { type:'buffer', bookType:'xlsx' });
  res.setHeader('Content-Disposition','attachment; filename=actuals.xlsx');
  res.send(buf);
});

// Export Entries
app.get('/api/entries/export', protect, restrictTo('manager','admin'), async (req, res, next) => {
  const q = {};
  if (req.query.type) q.type = req.query.type;
  if (req.user.role==='manager') q.managerId = req.user._id;
  const all = await Entry.find(q).lean();
  const ws = xlsx.utils.json_to_sheet(all);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Entries');
  const buf = xlsx.write(wb, { type:'buffer', bookType:'xlsx' });
  res.setHeader('Content-Disposition','attachment; filename=entries.xlsx');
  res.send(buf);
});


// global error
app.use((e,_,res,__)=>
  res.status(e.status||500).json({message:e.message})
);

// START
const PORT = process.env.PORT||5000;
app.listen(PORT,()=>console.log(`🟢 Server listening on ${PORT}`));
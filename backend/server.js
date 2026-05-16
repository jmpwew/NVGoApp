require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

/*  IMPORT DB */
const pool = require('./config/db'); // make sure you have db.js

/*  IMPORT MULTER */
const multer = require('multer');
const path = require('path');

/*  MULTER CONFIG */
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});



/* ROUTES */
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const newsRoutes = require('./routes/newsRoutes');
const profileRoutes = require('./routes/profileRoutes');
const changePasswordRoute = require('./routes/changePasswordRoute');

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth/password', changePasswordRoute);

/* STATIC FILES */
app.use('/uploads', express.static('uploads'));



  



/* TEST */
app.get('/', (req, res) => {
  res.send('NVGo API is running');
});

/* START */
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
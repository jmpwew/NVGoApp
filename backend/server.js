require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

/*  IMPORT DB */
const pool = require('./config/db'); 

/*  IMPORT MULTER */
const multer = require('multer');
const path = require('path');

/*  MULTER CONFIG */




/* ROUTES */
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const newsRoutes = require('./routes/newsRoutes');
const profileRoutes = require('./routes/profileRoutes');
const changePasswordRoute = require('./routes/changePasswordRoute');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const hotlineRoutes = require('./routes/hotlineRoutes');

app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth/password', changePasswordRoute);
app.use('/api/hotlines', hotlineRoutes);

/* STATIC FILES */
app.use('/uploads', express.static('uploads'));



  



/* TEST */
app.get('/', (req, res) => {
  res.send('NVGo API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
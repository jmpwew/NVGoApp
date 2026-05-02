const express = require('express');
const pool = require('../config/db');
const upload = require('../config/multer'); 

const router = express.Router();

// CREATE REPORT
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('BODY:', req.body);   
    console.log('FILE:', req.file);  
     
   
    const { name, contact, description, latitude, longitude, location_note } = req.body;

    const image = req.file ? req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO reports (name, contact, description, latitude, longitude, image, location_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, contact, description, latitude, longitude, image, location_note]
    );
   
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving report' });
  }
});

// GET REPORTS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
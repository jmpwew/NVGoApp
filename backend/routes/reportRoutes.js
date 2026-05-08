const express = require('express');
const pool = require('../config/db');
const upload = require('../config/multer'); 

const router = express.Router();

// CREATE REPORT
router.post('/', upload.array('images', 5), async (req, res) => {  
  try {
   
    const {user_id, name, contact, description, latitude, longitude, location_note } = req.body;

    const images = req.files
    ? req.files.map(file => file.filename)
    : [];

    const result = await pool.query(
      `INSERT INTO reports (user_id, name, contact, description, latitude, longitude, images, location_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8 )
       RETURNING *`,
      [user_id, name, contact, description, latitude, longitude, images, location_note]
    );
   
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving report' });
  }
});

// GET REPORTS


router.get('/user/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
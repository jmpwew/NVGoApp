const express = require('express');
const pool = require('../config/db');
const upload = require('../config/multer');

const router = express.Router();


//  CREATE NEWS (with image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    const { title, content, category } = req.body;

    const image = req.file ? req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO news (title, content, category, image)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, category, image]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


//  GET NEWS BY CATEGORY 
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      'SELECT * FROM news WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


//  GET ALL NEWS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM news ORDER BY created_at DESC'
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
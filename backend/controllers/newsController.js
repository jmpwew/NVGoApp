const pool = require('../config/db');
const { uploadToFirebase } = require('../utils/uploadToFirebase');

exports.createNews = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const image = req.file
      ? await uploadToFirebase(req.file, 'news-images')
      : null;

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
};

exports.getNewsByCategory = async (req, res) => {
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
};

exports.getAllNews = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM news ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
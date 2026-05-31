const pool = require('../config/db');

// GET all hotlines
const getHotlines = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hotlines ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create hotline (admin)
const createHotline = async (req, res) => {
  const { name, number, category } = req.body;
  if (!name || !number) return res.status(400).json({ message: 'Name and number are required' });
  try {
    const result = await pool.query(
      'INSERT INTO hotlines (name, number, category) VALUES ($1, $2, $3) RETURNING *',
      [name, number, category || 'General']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT update hotline (admin)
const updateHotline = async (req, res) => {
  const { id } = req.params;
  const { name, number, category } = req.body;
  try {
    const result = await pool.query(
      'UPDATE hotlines SET name=$1, number=$2, category=$3 WHERE id=$4 RETURNING *',
      [name, number, category, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Hotline not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE hotline (admin)
const deleteHotline = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM hotlines WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Hotline not found' });
    res.json({ message: 'Hotline deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getHotlines, createHotline, updateHotline, deleteHotline };
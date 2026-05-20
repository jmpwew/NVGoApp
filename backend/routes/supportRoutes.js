const express = require('express');
const pool = require('../config/db');
const router = express.Router();
 
// POST /api/support  — submit a message (no auth required)
router.post('/', async (req, res) => {
  try {
    const { name, message } = req.body;
 
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
 
    const result = await pool.query(
      `INSERT INTO support_messages (name, message)
       VALUES ($1, $2) RETURNING *`,
      [name.trim(), message.trim()]
    );
 
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});
 
module.exports = router;
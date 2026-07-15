const pool = require('../config/db');
const { createAlert } = require('./alertController');

exports.submitSupportMessage = async (req, res) => {
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

    const newMessage = result.rows[0];

    createAlert({
      type: 'support',
      related_id: newMessage.id,
      title: 'New support message',
      detail: `From ${newMessage.name}`,
    }).catch(err => console.error('createAlert (support) failed:', err));

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

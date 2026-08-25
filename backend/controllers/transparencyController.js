const pool = require('../config/db');
const { uploadToSupabase } = require('../utils/uploadToSupabase');

// ---------- BOARD ----------

// GET /api/transparency  (public)
// Only returns the board if it has been published. Citizens should never
// see a half-filled-in draft.
exports.getPublicBoard = async (req, res) => {
  try {
    const boardResult = await pool.query(
      'SELECT * FROM transparency_board WHERE id = 1'
    );
    const board = boardResult.rows[0];

    if (!board || !board.is_published) {
      return res.status(404).json({ message: 'Transparency board is not published yet.' });
    }

    const infrastructure = await pool.query(
      'SELECT * FROM transparency_infrastructure ORDER BY sort_order ASC, id ASC'
    );
    const accomplishments = await pool.query(
      'SELECT * FROM transparency_accomplishments ORDER BY sort_order ASC, id ASC'
    );

    res.json({
      board,
      infrastructure: infrastructure.rows,
      accomplishments: accomplishments.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/transparency/admin  (admin)
// Always returns the full data regardless of publish state, so admin can
// keep editing a board that isn't live yet.
exports.getAdminBoard = async (req, res) => {
  try {
    const boardResult = await pool.query(
      'SELECT * FROM transparency_board WHERE id = 1'
    );
    const board = boardResult.rows[0];

    const infrastructure = await pool.query(
      'SELECT * FROM transparency_infrastructure ORDER BY sort_order ASC, id ASC'
    );
    const accomplishments = await pool.query(
      'SELECT * FROM transparency_accomplishments ORDER BY sort_order ASC, id ASC'
    );

    res.json({
      board,
      infrastructure: infrastructure.rows,
      accomplishments: accomplishments.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/transparency  (admin)
exports.updateBoard = async (req, res) => {
  try {
    const {
      lgu_name,
      reporting_period,
      total_budget,
      budget_spent,
      budget_remaining,
      is_published,
    } = req.body;

    const result = await pool.query(
      `UPDATE transparency_board
       SET lgu_name = $1,
           reporting_period = $2,
           total_budget = $3,
           budget_spent = $4,
           budget_remaining = $5,
           is_published = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        lgu_name,
        reporting_period,
        total_budget || 0,
        budget_spent || 0,
        budget_remaining || 0,
        is_published === true || is_published === 'true',
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- INFRASTRUCTURE ----------

// POST /api/transparency/infrastructure  (admin)
exports.createInfrastructure = async (req, res) => {
  try {
    const { name, status, cost, sort_order } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : null;

    const result = await pool.query(
      `INSERT INTO transparency_infrastructure (name, status, cost, image, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, status || 'ongoing', cost || null, image, sort_order || 0]
    );

    touchBoardUpdatedAt();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/transparency/infrastructure/:id  (admin)
exports.updateInfrastructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, cost, sort_order } = req.body;

    const existing = await pool.query(
      'SELECT * FROM transparency_infrastructure WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Infrastructure item not found' });
    }

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : existing.rows[0].image;

    const result = await pool.query(
      `UPDATE transparency_infrastructure
       SET name = $1, status = $2, cost = $3, image = $4, sort_order = $5
       WHERE id = $6
       RETURNING *`,
      [name, status, cost || null, image, sort_order ?? existing.rows[0].sort_order, id]
    );

    touchBoardUpdatedAt();
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/transparency/infrastructure/:id  (admin)
exports.deleteInfrastructure = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transparency_infrastructure WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Infrastructure item not found' });
    }
    touchBoardUpdatedAt();
    res.json({ message: 'Infrastructure item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- ACCOMPLISHMENTS ----------

// POST /api/transparency/accomplishments  (admin)
exports.createAccomplishment = async (req, res) => {
  try {
    const { title, description, sort_order } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : null;

    const result = await pool.query(
      `INSERT INTO transparency_accomplishments (title, description, image, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description || '', image, sort_order || 0]
    );

    touchBoardUpdatedAt();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/transparency/accomplishments/:id  (admin)
exports.updateAccomplishment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sort_order } = req.body;

    const existing = await pool.query(
      'SELECT * FROM transparency_accomplishments WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Accomplishment not found' });
    }

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : existing.rows[0].image;

    const result = await pool.query(
      `UPDATE transparency_accomplishments
       SET title = $1, description = $2, image = $3, sort_order = $4
       WHERE id = $5
       RETURNING *`,
      [title, description, image, sort_order ?? existing.rows[0].sort_order, id]
    );

    touchBoardUpdatedAt();
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/transparency/accomplishments/:id  (admin)
exports.deleteAccomplishment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transparency_accomplishments WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Accomplishment not found' });
    }
    touchBoardUpdatedAt();
    res.json({ message: 'Accomplishment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bumps the board's updated_at whenever an itemized list changes, so the
// "last updated" label on the public board stays accurate even if admin
// only edited an infrastructure item and not the budget fields.
function touchBoardUpdatedAt() {
  pool.query(
    `UPDATE transparency_board SET updated_at = CURRENT_TIMESTAMP WHERE id = 1`
  ).catch(err => console.error('touchBoardUpdatedAt failed:', err));
}

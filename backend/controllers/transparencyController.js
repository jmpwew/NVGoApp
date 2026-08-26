const pool = require('../config/db');
const { uploadToSupabase } = require('../utils/uploadToSupabase');

const FUND_TYPES = ['general', 'dev_fund', 'sef', 'gad', 'drrm'];


exports.getPublicBoard = async (req, res) => {
  try {
    const boardResult = await pool.query(
      'SELECT * FROM transparency_board WHERE id = 1'
    );
    const board = boardResult.rows[0];

    if (!board || !board.is_published) {
      return res.status(404).json({ message: 'Transparency board is not published yet.' });
    }

    const [funds, infrastructure, accomplishments, documents, sections] = await Promise.all([
      pool.query('SELECT * FROM transparency_funds ORDER BY sort_order ASC'),
      pool.query('SELECT * FROM transparency_infrastructure ORDER BY sort_order ASC, id ASC'),
      pool.query('SELECT * FROM transparency_accomplishments ORDER BY sort_order ASC, id ASC'),
      pool.query('SELECT * FROM transparency_documents ORDER BY sort_order ASC, id ASC'),
      pool.query('SELECT * FROM transparency_sections WHERE is_published = true ORDER BY sort_order ASC, id ASC'),
    ]);

    res.json({
      board,
      funds: funds.rows,
      infrastructure: infrastructure.rows,
      accomplishments: accomplishments.rows,
      documents: documents.rows,
      sections: sections.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminBoard = async (req, res) => {
  try {
    const boardResult = await pool.query(
      'SELECT * FROM transparency_board WHERE id = 1'
    );
    const board = boardResult.rows[0];

    const [funds, infrastructure, accomplishments, documents, sections] = await Promise.all([
      pool.query('SELECT * FROM transparency_funds ORDER BY sort_order ASC'),
      pool.query('SELECT * FROM transparency_infrastructure ORDER BY sort_order ASC, id ASC'),
      pool.query('SELECT * FROM transparency_accomplishments ORDER BY sort_order ASC, id ASC'),
      pool.query('SELECT * FROM transparency_documents ORDER BY sort_order ASC, id ASC'),
      pool.query('SELECT * FROM transparency_sections ORDER BY sort_order ASC, id ASC'),
    ]);

    res.json({
      board,
      funds: funds.rows,
      infrastructure: infrastructure.rows,
      accomplishments: accomplishments.rows,
      documents: documents.rows,
      sections: sections.rows,
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
      official_name,
      official_position,
      data_as_of,
      source_note,
      is_published,
    } = req.body;

    const result = await pool.query(
      `UPDATE transparency_board
       SET lgu_name = $1,
           reporting_period = $2,
           official_name = $3,
           official_position = $4,
           data_as_of = $5,
           source_note = $6,
           is_published = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        lgu_name,
        reporting_period,
        official_name || null,
        official_position || null,
        data_as_of || null,
        source_note || null,
        is_published === true || is_published === 'true',
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateFunds = async (req, res) => {
  try {
    const { funds } = req.body;
    if (!Array.isArray(funds)) {
      return res.status(400).json({ message: 'funds must be an array' });
    }

    const updated = [];
    for (const f of funds) {
      if (!FUND_TYPES.includes(f.fund_type)) continue;
      const result = await pool.query(
        `UPDATE transparency_funds
         SET allocated = $1, spent = $2, remaining = $3
         WHERE fund_type = $4
         RETURNING *`,
        [f.allocated || 0, f.spent || 0, f.remaining || 0, f.fund_type]
      );
      if (result.rows[0]) updated.push(result.rows[0]);
    }

    touchBoardUpdatedAt();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.createDocument = async (req, res) => {
  try {
    const { title, sort_order } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!req.file) return res.status(400).json({ message: 'A file is required' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    const file_url = await uploadToSupabase(req.file, 'transparency-documents');

    const result = await pool.query(
      `INSERT INTO transparency_documents (title, file_url, sort_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, file_url, sort_order || 0]
    );

    touchBoardUpdatedAt();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/transparency/documents/:id  (admin)
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transparency_documents WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    touchBoardUpdatedAt();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- INFRASTRUCTURE ----------

// POST /api/transparency/infrastructure  (admin)
exports.createInfrastructure = async (req, res) => {
  try {
    const {
      name, status, cost, sort_order,
      category, barangay, progress_percent, target_completion_date,
    } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : null;

    const result = await pool.query(
      `INSERT INTO transparency_infrastructure
         (name, status, cost, image, sort_order, category, barangay, progress_percent, target_completion_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        status || 'ongoing',
        cost || null,
        image,
        sort_order || 0,
        category || null,
        barangay || null,
        progress_percent === '' || progress_percent == null ? null : progress_percent,
        target_completion_date || null,
      ]
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
    const {
      name, status, cost, sort_order,
      category, barangay, progress_percent, target_completion_date,
    } = req.body;

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
       SET name = $1, status = $2, cost = $3, image = $4, sort_order = $5,
           category = $6, barangay = $7, progress_percent = $8, target_completion_date = $9
       WHERE id = $10
       RETURNING *`,
      [
        name,
        status,
        cost || null,
        image,
        sort_order ?? existing.rows[0].sort_order,
        category || null,
        barangay || null,
        progress_percent === '' || progress_percent == null ? null : progress_percent,
        target_completion_date || null,
        id,
      ]
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
    const { title, description, sort_order, category } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : null;

    const result = await pool.query(
      `INSERT INTO transparency_accomplishments (title, description, image, sort_order, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || '', image, sort_order || 0, category || null]
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
    const { title, description, sort_order, category } = req.body;

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
       SET title = $1, description = $2, image = $3, sort_order = $4, category = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, image, sort_order ?? existing.rows[0].sort_order, category || null, id]
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

// ---------- MORE: custom sections ----------

// POST /api/transparency/sections  (admin)
exports.createSection = async (req, res) => {
  try {
    const { title, content, sort_order, is_published } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : null;

    const result = await pool.query(
      `INSERT INTO transparency_sections (title, content, image, sort_order, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        content || '',
        image,
        sort_order || 0,
        is_published === false || is_published === 'false' ? false : true,
      ]
    );

    touchBoardUpdatedAt();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/transparency/sections/:id  (admin)
exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, sort_order, is_published } = req.body;

    const existing = await pool.query(
      'SELECT * FROM transparency_sections WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const image = req.file
      ? await uploadToSupabase(req.file, 'transparency-images')
      : existing.rows[0].image;

    const result = await pool.query(
      `UPDATE transparency_sections
       SET title = $1, content = $2, image = $3, sort_order = $4,
           is_published = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        title,
        content || '',
        image,
        sort_order ?? existing.rows[0].sort_order,
        is_published === true || is_published === 'true',
        id,
      ]
    );

    touchBoardUpdatedAt();
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/transparency/sections/:id  (admin)
exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transparency_sections WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Section not found' });
    }
    touchBoardUpdatedAt();
    res.json({ message: 'Section deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


function touchBoardUpdatedAt() {
  pool.query(
    `UPDATE transparency_board SET updated_at = CURRENT_TIMESTAMP WHERE id = 1`
  ).catch(err => console.error('touchBoardUpdatedAt failed:', err));
}

const pool = require('../config/db');

// Flips any active announcement whose duration has passed over to inactive.
// Called both lazily (on every read) and on a timer (see server.js), so an
// announcement disappears from the app close to the moment it expires even
// if nobody happens to hit the API right then.
async function expireAnnouncements() {
  try {
    await pool.query(
      `UPDATE announcements
       SET is_active = FALSE, updated_at = NOW()
       WHERE is_active = TRUE
         AND expires_at IS NOT NULL
         AND expires_at <= NOW()`
    );
  } catch (err) {
    console.error('Failed to expire announcements:', err);
  }
}

module.exports = expireAnnouncements;

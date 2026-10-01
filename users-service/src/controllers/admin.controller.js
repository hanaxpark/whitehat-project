const db = require('../config/db');

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const q = String(req.query.q || '').trim().slice(0, 100);
    const offset = (page - 1) * pageSize;

    let where = '';
    const params = [];

    if (q) {
      where = `WHERE CAST(id AS CHAR) LIKE ?
               OR username LIKE ?
               OR email LIKE ?
               OR nickname LIKE ?`;

      const keyword = `%${q}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM users
       ${where}`,
      params
    );

    const [rows] = await db.execute(
      `SELECT id, username, email, nickname, created_at, role
       FROM users
       ${where}
       ORDER BY id DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    res.json({
      items: rows,
      total: Number(countRows[0].total),
      page,
      pageSize
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to load users',
      code: 'ADMIN_USERS_FAILED'
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, username, email, nickname, profile_image_url, role, created_at
       FROM users
       WHERE id=?`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to load user',
      code: 'ADMIN_USER_FAILED'
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const role = String(req.body.role || '').toUpperCase();

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        message: 'role must be USER or ADMIN',
        code: 'INVALID_ROLE'
      });
    }

    const [result] = await db.execute(
      'UPDATE users SET role=? WHERE id=?',
      [role, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to update user',
      code: 'ADMIN_ROLE_FAILED'
    });
  }
};

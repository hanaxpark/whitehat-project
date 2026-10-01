const db = require('../config/db');

// 전체 회원 조회
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, username, email, nickname, profile_image_url, role, created_at
       FROM users
       ORDER BY id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load users' });
  }
};

// 회원 상세 조회
exports.getUser = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, username, email, nickname, profile_image_url, role, created_at
       FROM users
       WHERE id=?`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load user' });
  }
};

// 회원 권한 변경
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'role must be USER or ADMIN' });
    }

    const [result] = await db.execute(
      'UPDATE users SET role=? WHERE id=?',
      [role, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

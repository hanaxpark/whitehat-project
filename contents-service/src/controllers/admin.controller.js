const db = require('../config/db');

// 전체 게시글 조회
exports.listPosts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.username, u.nickname
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load posts' });
  }
};

// 게시글 강제 삭제
exports.deletePost = async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM posts WHERE id=?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// 전체 댓글 조회
exports.listComments = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, u.username, u.nickname
       FROM comments c
       JOIN users u ON u.id = c.user_id
       ORDER BY c.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load comments' });
  }
};

// 댓글 강제 삭제
exports.deleteComment = async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM comments WHERE id=?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

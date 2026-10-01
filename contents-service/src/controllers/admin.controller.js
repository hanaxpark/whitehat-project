const db = require('../config/db');

function paging(req) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(req.query.pageSize, 10) || 10, 1),
    100
  );

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize
  };
}

// 관리자 - 전체 게시글 조회
exports.listPosts = async (req, res) => {
  try {
    const { page, pageSize, offset } = paging(req);
    const q = String(req.query.q || '').trim().slice(0, 100);
    const category = String(req.query.category || '').trim();

    const conditions = [];
    const params = [];

    if (q) {
      conditions.push(
        '(p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ?)'
      );

      const keyword = `%${q}%`;
      params.push(keyword, keyword, keyword);
    }

    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ${where}`,
      params
    );

    const [rows] = await db.execute(
      `SELECT
         p.*,
         u.nickname,
         (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         FALSE AS liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC, p.id DESC
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
      message: 'Failed to load posts',
      code: 'ADMIN_POSTS_FAILED'
    });
  }
};

// 관리자 - 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();

    if (reason.length > 300) {
      return res.status(422).json({
        message: 'reason must be 300 characters or less',
        code: 'INVALID_REASON'
      });
    }

    const [result] = await db.execute(
      'DELETE FROM posts WHERE id=?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to delete post',
      code: 'ADMIN_DELETE_POST_FAILED'
    });
  }
};

// 관리자 - 전체 댓글 조회
exports.listComments = async (req, res) => {
  try {
    const { page, pageSize, offset } = paging(req);
    const q = String(req.query.q || '').trim().slice(0, 100);

    let where = '';
    const params = [];

    if (q) {
      where = `
        WHERE c.content LIKE ?
           OR u.nickname LIKE ?
           OR p.title LIKE ?
      `;

      const keyword = `%${q}%`;
      params.push(keyword, keyword, keyword);
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       ${where}`,
      params
    );

    const [rows] = await db.execute(
      `SELECT
         c.id,
         c.post_id,
         c.user_id,
         u.nickname,
         c.content,
         c.created_at,
         p.title AS post_title
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       ${where}
       ORDER BY c.created_at DESC, c.id DESC
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
      message: 'Failed to load comments',
      code: 'ADMIN_COMMENTS_FAILED'
    });
  }
};

// 관리자 - 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();

    if (reason.length > 300) {
      return res.status(422).json({
        message: 'reason must be 300 characters or less',
        code: 'INVALID_REASON'
      });
    }

    const [result] = await db.execute(
      'DELETE FROM comments WHERE id=?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to delete comment',
      code: 'ADMIN_DELETE_COMMENT_FAILED'
    });
  }
};

const db = require('../config/db');

exports.me = async (req,res) => {
  const [rows] = await db.execute(
    'SELECT id,username,email,nickname,profile_image_url,role,created_at FROM users WHERE id=?',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({message:'User not found'});
  res.json(rows[0]);
};

exports.updateMe = async (req,res) => {
  const { nickname, profile_image_url } = req.body;
  if (!nickname) return res.status(400).json({message:'nickname is required'});
  await db.execute(
    'UPDATE users SET nickname=?, profile_image_url=? WHERE id=?',
    [nickname, profile_image_url || null, req.user.id]
  );
  res.json({message:'Profile updated'});
};

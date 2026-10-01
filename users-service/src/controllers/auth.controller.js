const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  const { username, email, password, nickname } = req.body;
  if (!username || !email || !password || !nickname)
    return res.status(400).json({ message: 'Required fields missing' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users(username,email,password_hash,nickname) VALUES(?,?,?,?)',
      [username,email,hash,nickname]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500)
       .json({ message: e.code === 'ER_DUP_ENTRY' ? 'User already exists' : 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.execute('SELECT * FROM users WHERE username=? OR email=? LIMIT 1',[username, username]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ message:'Invalid credentials' });

  const token = jwt.sign({ id:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'2h' });
  res.json({ token, user:{ id:user.id, username:user.username, nickname:user.nickname, role:user.role } });
};


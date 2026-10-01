const db=require('../config/db');

exports.list=async(req,res)=>{
  const {q='',category='',sort='latest'}=req.query;
  let where='WHERE 1=1'; const params=[];
  if(q){where+=' AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ?)'; const t=`%${q}%`; params.push(t,t,t);}
  if(category){where+=' AND p.category=?'; params.push(category);}
  const order=sort==='popular'?'like_count DESC, p.created_at DESC':'p.created_at DESC';
  const [rows]=await db.execute(`
    SELECT p.id,p.title,p.category,p.image_url,p.view_count,p.created_at,u.nickname,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS comment_count
    FROM posts p JOIN users u ON u.id=p.user_id ${where}
    ORDER BY ${order} LIMIT 100`,params);
  res.json(rows);
};

exports.detail=async(req,res)=>{
  await db.execute('UPDATE posts SET view_count=view_count+1 WHERE id=?',[req.params.id]);
  const [rows]=await db.execute('SELECT p.*,u.nickname FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=?',[req.params.id]);
  if(!rows[0]) return res.status(404).json({message:'Post not found'});
  res.json(rows[0]);
};

exports.create=async(req,res)=>{
  const {title,content,category,image_url}=req.body;
  if(!title||!content||!category) return res.status(400).json({message:'Required fields missing'});
  const [r]=await db.execute('INSERT INTO posts(user_id,title,content,category,image_url) VALUES(?,?,?,?,?)',[req.user.id,title,content,category,image_url||null]);
  res.status(201).json({id:r.insertId});
};

exports.update=async(req,res)=>{
  const [rows]=await db.execute('SELECT user_id FROM posts WHERE id=?',[req.params.id]);
  if(!rows[0]) return res.status(404).json({message:'Post not found'});
  if(rows[0].user_id!==req.user.id && req.user.role!=='ADMIN') return res.status(403).json({message:'Forbidden'});
  const {title,content,category}=req.body;
  await db.execute('UPDATE posts SET title=COALESCE(?,title),content=COALESCE(?,content),category=COALESCE(?,category) WHERE id=?',[title??null,content??null,category??null,req.params.id]);
  res.json({message:'Post updated'});
};

exports.remove=async(req,res)=>{
  const [rows]=await db.execute('SELECT user_id FROM posts WHERE id=?',[req.params.id]);
  if(!rows[0]) return res.status(404).end();
  if(rows[0].user_id!==req.user.id && req.user.role!=='ADMIN') return res.status(403).end();
  await db.execute('DELETE FROM posts WHERE id=?',[req.params.id]);
  res.status(204).end();
};

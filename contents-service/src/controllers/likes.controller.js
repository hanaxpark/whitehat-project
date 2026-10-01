const db=require('../config/db');
exports.like=async(req,res)=>{await db.execute('INSERT IGNORE INTO likes(user_id,post_id) VALUES(?,?)',[req.user.id,req.params.postId]);res.json({liked:true})};
exports.unlike=async(req,res)=>{await db.execute('DELETE FROM likes WHERE user_id=? AND post_id=?',[req.user.id,req.params.postId]);res.json({liked:false})};

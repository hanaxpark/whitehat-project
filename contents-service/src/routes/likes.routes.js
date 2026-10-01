const r=require('express').Router(),c=require('../controllers/likes.controller'),auth=require('../middleware/auth');
r.post('/posts/:postId/like',auth,c.like); r.delete('/posts/:postId/like',auth,c.unlike);
module.exports=r;

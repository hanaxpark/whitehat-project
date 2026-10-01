const r=require('express').Router(),c=require('../controllers/comments.controller'),auth=require('../middleware/auth');
r.get('/posts/:postId/comments',c.list); r.post('/posts/:postId/comments',auth,c.create);
r.patch('/comments/:id',auth,c.update); r.delete('/comments/:id',auth,c.remove);
module.exports=r;

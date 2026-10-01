const r=require('express').Router(),c=require('../controllers/posts.controller'),auth=require('../middleware/auth');
r.get('/',c.list); r.get('/:id',c.detail); r.post('/',auth,c.create); r.patch('/:id',auth,c.update); r.delete('/:id',auth,c.remove);
module.exports=r;

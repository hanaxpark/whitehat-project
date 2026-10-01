const router=require('express').Router();
const c=require('../controllers/users.controller');
const auth=require('../middleware/auth');
router.get('/me',auth,c.me);
router.patch('/me',auth,c.updateMe);
module.exports=router;

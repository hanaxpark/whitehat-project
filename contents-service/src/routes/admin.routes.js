const router = require('express').Router();

const controller = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/posts', auth, admin, controller.listPosts);
router.delete('/posts/:id', auth, admin, controller.deletePost);

router.get('/comments', auth, admin, controller.listComments);
router.delete('/comments/:id', auth, admin, controller.deleteComment);

module.exports = router;

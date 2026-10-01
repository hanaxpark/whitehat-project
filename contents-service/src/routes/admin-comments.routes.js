const router = require('express').Router();

const controller = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, admin, controller.listComments);
router.delete('/:id', auth, admin, controller.deleteComment);

module.exports = router;

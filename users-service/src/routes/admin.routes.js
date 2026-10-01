const router = require('express').Router();

const controller = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/users', auth, admin, controller.listUsers);
router.get('/users/:id', auth, admin, controller.getUser);
router.patch('/users/:id/role', auth, admin, controller.updateUserRole);

module.exports = router;

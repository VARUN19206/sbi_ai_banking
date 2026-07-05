const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
router.use(protect);
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/change-password', changePassword);
module.exports = router;
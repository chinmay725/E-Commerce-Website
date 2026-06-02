// routes/auth.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp',    ctrl.sendOtp);
router.post('/verify-otp',  ctrl.verifyOtp);
router.post('/login',       ctrl.login);
router.get ('/me',          protect, ctrl.getMe);
router.put ('/profile',     protect, ctrl.updateProfile);

module.exports = router;

const express = require('express');
const { submitFeedback, getAgentAccuracy } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
router.use(protect);
router.post('/', submitFeedback);
router.get('/stats', getAgentAccuracy);
module.exports = router;
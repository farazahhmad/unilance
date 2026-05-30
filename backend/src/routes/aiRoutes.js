const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/generate', verifyToken, aiController.generateContent);

module.exports = router;
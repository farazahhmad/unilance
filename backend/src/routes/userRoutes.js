const express = require('express');
const router = express.Router(); // This MUST use Express!
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware'); 
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// --- ENDPOINTS ---

// Public routes
router.get('/search', userController.searchUsers);
router.get('/worker/:workerId', userController.getWorkerProfile);
router.get('/all', userController.getAllUsers);
router.get('/:id', userController.getUserProfile);

// Protected routes
router.put('/profile', verifyToken, userController.updateProfile);
router.post('/profile-photo', verifyToken, upload.single('profilePhoto'), userController.uploadProfilePhoto);

module.exports = router;
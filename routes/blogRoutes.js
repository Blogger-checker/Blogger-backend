const express = require('express');
const router = express.Router();
const multer = require('multer');
const blogController = require('../controller/blogController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Routes
router.post('/submit', upload.single('blogFile'), blogController.submitBlog);
router.get('/published', blogController.getPublishedBlogs);
router.get('/:id', blogController.getBlogById);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const blogController = require('../controller/blogController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Define allowed file types
        const allowedMimeTypes = [
            'application/pdf',  // PDF files
            'application/msword',  // .doc files
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx files
            'text/plain'  // .txt files
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Routes
router.get('/', blogController.check);
router.post('/submit', upload.single('blogFile'), blogController.submitBlog);
router.post('/:id/publish', blogController.publishBlog);
router.get('/published', blogController.getPublishedBlogs);
router.get('/:id', blogController.getBlogById);

module.exports = router;

const Blog = require('../models/Blog');
const PublishedBlog = require('../models/PublishedBlog');
const { sendWordCountRejection, sendPlagiarismRejection, sendPublicationConfirmation } = require('../utils/emailService');
const PlagiarismChecker = require('plagiarism-checker');
const pdfParse = require('pdf-parse');

// Initialize plagiarism checker
const checker = new PlagiarismChecker();

// Helper function to count words
const countWords = (text) => {
    return text.trim().split(/\s+/).length;
};

// Helper function to check plagiarism
const checkPlagiarism = async (content) => {
    try {
        const result = await checker.check(content);
        return result.isPlagiarized;
    } catch (error) {
        console.error('Error checking plagiarism:', error);
        throw error;
    }
};

// Submit new blog
exports.submitBlog = async (req, res) => {
    try {
        const { authorName, email, category } = req.body;
        const blogFile = req.file;

        if (!blogFile) {
            return res.status(400).json({ message: 'Please upload a blog file' });
        }

        // Read PDF content
        const dataBuffer = blogFile.buffer;
        const pdfData = await pdfParse(dataBuffer);
        const content = pdfData.text;
        const wordCount = countWords(content);

        const blog = new Blog({
            authorName,
            email,
            category,
            blogFile: blogFile.originalname,
            content,
            wordCount
        });

        await blog.save();

        // Check word count
        if (wordCount < 800) {
            blog.status = 'rejected';
            blog.rejectionReason = 'Word count less than 800';
            await blog.save();
            await sendWordCountRejection(email, authorName);
            return res.status(400).json({ message: 'Blog rejected: Word count less than 800' });
        }

        // Check plagiarism
        const isPlagiarized = await checkPlagiarism(content);
        if (isPlagiarized) {
            blog.status = 'rejected';
            blog.rejectionReason = 'Plagiarized content';
            blog.isPlagiarized = true;
            await blog.save();
            await sendPlagiarismRejection(email, authorName);
            return res.status(400).json({ message: 'Blog rejected: Plagiarized content detected' });
        }

        // If all checks pass, create a new published blog
        const publicUrl = `${process.env.FRONTEND_URL}/blogs/${blog._id}`;
        
        const publishedBlog = new PublishedBlog({
            authorName,
            email,
            category,
            content,
            wordCount,
            publicUrl
        });

        await publishedBlog.save();

        // Update original blog status
        blog.status = 'published';
        blog.publishedAt = new Date();
        blog.publicUrl = publicUrl;
        await blog.save();

        // Send publication confirmation
        await sendPublicationConfirmation(email, authorName, publicUrl);

        res.status(201).json({
            message: 'Blog published successfully',
            blog: publishedBlog
        });
    } catch (error) {
        console.error('Error submitting blog:', error);
        res.status(500).json({ message: 'Error submitting blog' });
    }
};

// Get all published blogs
exports.getPublishedBlogs = async (req, res) => {
    try {
        const blogs = await PublishedBlog.find()
            .select('authorName category content publishedAt publicUrl')
            .sort({ publishedAt: -1 });
        
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
    try {
        const blog = await PublishedBlog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.status(200).json(blog);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ message: 'Error fetching blog' });
    }
};

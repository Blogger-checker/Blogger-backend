const Blog = require('../models/Blog');
const PublishedBlog = require('../models/PublishedBlog');
const { sendWordCountRejection, sendPlagiarismRejection, sendPublicationConfirmation } = require('../utils/emailService');
const PlagiarismChecker = require('plagiarism-checker');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Initialize plagiarism checker
const checker = new PlagiarismChecker();

exports.check = async (req, res) => {
    try {
        console.log('App is running');
    }catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: 'Error: ' + error.message });
    }
}
// Helper function to count words
const countWords = (text) => {
    return text.trim().split(/\s+/).length;
};

// Helper function to check plagiarism
const checkPlagiarism = async (content) => {
    try {
        // For demo purposes, we'll simulate plagiarism check
        // In a real application, you would use a proper plagiarism checking service
        const randomCheck = Math.random() > 0.8; // 20% chance of plagiarism for demo
        return {
            isPlagiarized: randomCheck,
            similarity: randomCheck ? Math.random() * 100 : 0
        };
    } catch (error) {
        console.error('Error checking plagiarism:', error);
        throw error;
    }
};

// Helper function to extract text from different file formats
const extractTextFromFile = async (file) => {
    const buffer = file.buffer;
    const mimeType = file.mimetype;

    try {
        switch (mimeType) {
            case 'application/pdf':
                const pdfData = await pdfParse(buffer);
                return pdfData.text;

            case 'application/msword': // .doc
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
                const result = await mammoth.extractRawText({ buffer });
                return result.value;

            case 'text/plain': // .txt
                return buffer.toString('utf-8');

            default:
                throw new Error('Unsupported file format');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Error processing file: ' + error.message);
    }
};

// Submit new blog
exports.submitBlog = async (req, res) => {
    try {
        const { authorName, email, category, title } = req.body;
        const blogFile = req.file;

        // Log incoming data for debugging
        console.log('Received data:', {
            authorName,
            email,
            category,
            title,
            hasFile: !!blogFile
        });

        // Validate required fields
        if (!authorName || !email || !category || !title) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    authorName: !authorName ? 'Author name is required' : null,
                    email: !email ? 'Email is required' : null,
                    category: !category ? 'Category is required' : null,
                    title: !title ? 'Title is required' : null
                }
            });
        }

        if (!blogFile) {
            return res.status(400).json({ message: 'Please upload a blog file' });
        }

        // Extract text content based on file type
        const content = await extractTextFromFile(blogFile);
        const wordCount = countWords(content);

        const blog = new Blog({
            authorName,
            email,
            category,
            title,
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
            try {
                await sendWordCountRejection(email, authorName);
            } catch (emailError) {
                console.error('Failed to send rejection email:', emailError);
            }
            return res.status(400).json({ 
                message: 'Blog rejected: Word count less than 800',
                wordCount,
                isPlagiarized: false
            });
        }

        // Check plagiarism
        const plagiarismResult = await checkPlagiarism(content);
        if (plagiarismResult.isPlagiarized) {
            blog.status = 'rejected';
            blog.rejectionReason = 'Plagiarized content';
            blog.isPlagiarized = true;
            blog.similarity = plagiarismResult.similarity;
            await blog.save();
            try {
                await sendPlagiarismRejection(email, authorName);
            } catch (emailError) {
                console.error('Failed to send plagiarism rejection email:', emailError);
            }
            return res.status(400).json({ 
                message: 'Blog rejected: Plagiarized content detected',
                wordCount,
                isPlagiarized: true,
                similarity: plagiarismResult.similarity
            });
        }

        // If all checks pass, create a new published blog
        const publicUrl = `${process.env.FRONTEND_URL}/blogs/${blog._id}`;
        
        const publishedBlog = new PublishedBlog({
            authorName,
            email,
            category,
            title,
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
        try {
            await sendPublicationConfirmation(email, authorName, publicUrl);
        } catch (emailError) {
            console.error('Failed to send publication confirmation email:', emailError);
        }

        res.status(201).json({
            message: 'Blog published successfully',
            blogId: blog._id,
            wordCount,
            isPlagiarized: false,
            publishedUrl: publicUrl
        });
    } catch (error) {
        console.error('Error submitting blog:', error);
        res.status(500).json({ 
            message: 'Error submitting blog: ' + error.message,
            error: error.stack
        });
    }
};

// Get all published blogs
exports.getPublishedBlogs = async (req, res) => {
    try {
        const blogs = await PublishedBlog.find()
            .select('authorName category title content publishedAt publicUrl wordCount')
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

// Publish blog
exports.publishBlog = async (req, res) => {
    try {
        const blogId = req.params.id;
        
        // Find the blog
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if blog is already published
        if (blog.status === 'published') {
            return res.status(400).json({ message: 'Blog is already published' });
        }

        // Create public URL
        const publicUrl = `${process.env.FRONTEND_URL}/blogs/${blog._id}`;

        // Create published blog
        const publishedBlog = new PublishedBlog({
            authorName: blog.authorName,
            email: blog.email,
            category: blog.category,
            content: blog.content,
            wordCount: blog.wordCount,
            publicUrl
        });

        await publishedBlog.save();

        // Update original blog
        blog.status = 'published';
        blog.publishedAt = new Date();
        blog.publicUrl = publicUrl;
        await blog.save();

        // Send publication confirmation email
        try {
            await sendPublicationConfirmation(blog.email, blog.authorName, publicUrl);
        } catch (emailError) {
            console.error('Failed to send publication confirmation email:', emailError);
        }

        res.status(200).json({
            message: 'Blog published successfully',
            publishedUrl: publicUrl,
            blog: publishedBlog
        });
    } catch (error) {
        console.error('Error publishing blog:', error);
        res.status(500).json({ 
            message: 'Error publishing blog: ' + error.message,
            error: error.stack
        });
    }
};

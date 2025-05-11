const mongoose = require('mongoose');

const publishedBlogSchema = new mongoose.Schema({
    authorName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    wordCount: {
        type: Number,
        required: true
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    publicUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PublishedBlog', publishedBlogSchema); 
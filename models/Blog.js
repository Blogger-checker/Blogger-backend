const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true
    },
    blogFile: {
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
    status: {
        type: String,
        enum: ['pending', 'published', 'rejected'],
        default: 'pending'
    },
    rejectionReason: String,
    isPlagiarized: {
        type: Boolean,
        default: false
    },
    similarity: Number,
    publishedAt: Date,
    publicUrl: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);

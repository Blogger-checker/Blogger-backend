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
    blogFile: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'rejected', 'published'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    wordCount: {
        type: Number
    },
    isPlagiarized: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    publicUrl: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);

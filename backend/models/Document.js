const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, enum: ['pending', 'signed'], default: 'pending' },
    signatureUrl: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);

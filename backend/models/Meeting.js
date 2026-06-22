const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    requester: { type: String, required: true },
    recipient: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);

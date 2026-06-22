const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');

// Helper to check for conflicts
const hasConflict = async (userId, date) => {
    const meetingDate = new Date(date);
    // Assuming a meeting lasts 1 hour. We check if there's any accepted meeting 
    // for this user within 1 hour before or after the proposed date.
    const oneHourBefore = new Date(meetingDate.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(meetingDate.getTime() + 60 * 60 * 1000);

    const conflict = await Meeting.findOne({
        status: 'accepted',
        $or: [{ requester: userId }, { recipient: userId }],
        date: { $gt: oneHourBefore, $lt: oneHourAfter }
    });

    return !!conflict;
};

// POST / (schedule meeting)
router.post('/', auth, async (req, res) => {
    try {
        const { recipient, date } = req.body;

        if (req.user.id === recipient) {
            return res.status(400).json({ message: 'You cannot schedule a meeting with yourself' });
        }

        // Check if requester has a conflict
        if (await hasConflict(req.user.id, date)) {
            return res.status(400).json({ message: 'You have a scheduling conflict at this time' });
        }

        // Check if recipient has a conflict
        if (await hasConflict(recipient, date)) {
            return res.status(400).json({ message: 'The recipient has a scheduling conflict at this time' });
        }

        const meeting = new Meeting({
            requester: req.user.id,
            recipient,
            date
        });

        await meeting.save();
        res.status(201).json(meeting);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /:id/accept
router.put('/:id/accept', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        if (meeting.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the recipient can accept this meeting' });
        }

        if (meeting.status !== 'pending') {
            return res.status(400).json({ message: 'Meeting is not pending' });
        }

        // Check for conflicts again before accepting
        if (await hasConflict(req.user.id, meeting.date)) {
            return res.status(400).json({ message: 'You have a scheduling conflict at this time' });
        }

        if (await hasConflict(meeting.requester, meeting.date)) {
            return res.status(400).json({ message: 'The requester has a scheduling conflict at this time' });
        }

        meeting.status = 'accepted';
        await meeting.save();

        res.json(meeting);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /:id/reject
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        if (meeting.recipient.toString() !== req.user.id && meeting.requester.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to reject this meeting' });
        }

        meeting.status = 'rejected';
        await meeting.save();

        res.json(meeting);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET / (list user's meetings)
router.get('/', auth, async (req, res) => {
    try {
        const meetings = await Meeting.find({
            $or: [{ requester: req.user.id }, { recipient: req.user.id }]
        });
        
        res.json(meetings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

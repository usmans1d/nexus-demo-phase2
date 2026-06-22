const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Setup multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// POST /upload
router.post('/upload', auth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const document = new Document({
            uploader: req.user.id,
            filename: req.file.originalname,
            url: `/uploads/${req.file.filename}`
        });

        await document.save();
        res.status(201).json(document);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /
router.get('/', auth, async (req, res) => {
    try {
        const documents = await Document.find({ uploader: req.user.id });
        res.json(documents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /:id/signature
router.post('/:id/signature', auth, upload.single('signature'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No signature file uploaded' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.uploader.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to sign this document' });
        }

        document.signatureUrl = `/uploads/${req.file.filename}`;
        document.status = 'signed';
        await document.save();

        res.json(document);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

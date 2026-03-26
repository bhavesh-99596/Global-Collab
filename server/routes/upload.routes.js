const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Reputation: +5 for uploading a file
        try {
            const reputationService = require('../services/reputation.service');
            if (req.user && req.user.id) {
                await reputationService.onFileUpload(req.user.id);
            }
        } catch (_) {}
        
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            data: {
                url: fileUrl,
                name: req.file.originalname,
                type: req.file.mimetype
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const upload = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiter');

// POST /api/ai/classify - Auto-categorize & urgency rating using Gemma / Gemini
router.post('/classify', aiLimiter, (req, res) => aiController.classify(req, res));

// POST /api/ai/chat - Conversational assistant for Lok Samadhan
router.post('/chat', aiLimiter, (req, res) => aiController.chat(req, res));

// POST /api/ai/analyze-image - Multimodal vision inspection
router.post('/analyze-image', aiLimiter, upload.single('image'), (req, res) => aiController.analyzeImage(req, res));

// POST /api/ai/verify-image - Intelligent image verification (civic detection + AI manipulation analysis + EXIF GPS)
router.post('/verify-image', aiLimiter, upload.single('image'), (req, res) => aiController.verifyImage(req, res));

// POST /api/ai/suggest-resolution - Generates official response draft
router.post('/suggest-resolution', aiLimiter, (req, res) => aiController.suggestResolution(req, res));

module.exports = router;

const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');

// Helper to convert question types to frontend labels
const mapToFrontendType = (aiType) => {
    const type = aiType.toLowerCase();
    if (type.includes('choice') || type.includes('select')) return 'Radio Button';
    if (type.includes('multiple')) return 'Checkbox List';
    if (type.includes('text') || type.includes('input')) return 'Singleline Text Input';
    if (type.includes('area') || type.includes('long')) return 'Multiline Text Input';
    if (type.includes('rating') || type.includes('scale')) return 'Rating';
    if (type.includes('date')) return 'Date';
    if (type.includes('signature')) return 'Signature';
    return 'Singleline Text Input';
};

const pdf = require('pdf-parse');

/**
 * @route POST /ai/generate-from-file
 * @desc Generate survey from an uploaded image or PDF
 */
router.post('/generate-from-file', upload.single('file'), async (req, res) => {
    console.log(`[AI Service] Received file: ${req.file?.originalname} (${req.file?.mimetype})`);
    
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'No file uploaded' }
        });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Gemini API key is not configured.');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        let extractedText = "";
        let useVision = false;

        // 1. TRY SELECTABLE TEXT EXTRACTION (For PDFs)
        if (req.file.mimetype === 'application/pdf') {
            try {
                const data = await pdf(req.file.buffer);
                extractedText = data.text.trim();
                console.log(`[AI Service] PDF Parse Extracted ${extractedText.length} characters.`);
                
                // If text is very short or empty, it's likely a scanned PDF
                if (extractedText.length < 50) {
                    console.log('[AI Service] Selectable text too short. Switching to Vision/OCR.');
                    useVision = true;
                }
            } catch (pdfErr) {
                console.warn('[AI Service] PDF Parse failed, falling back to Vision.', pdfErr);
                useVision = true;
            }
        } else {
            useVision = true; // Images always use vision
        }

        const strictPrompt = `
            You are an AI survey form generator.
            Extract all survey questions from the provided content.
            Return ONLY valid JSON.

            Format:
            {
              "title": "Survey Title",
              "questions": [
                {
                  "question": "",
                  "type": "text/radio/checkbox/dropdown/rating/textarea",
                  "required": true,
                  "options": []
                }
              ]
            }

            Rules:
            - No explanation
            - No markdown
            - No extra text
            - Detect question types automatically
            - Include options if available
        `;

        let result;
        if (useVision) {
            console.log('[AI Service] Using Gemini Vision for extraction...');
            const filePart = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };
            result = await model.generateContent([strictPrompt, filePart]);
        } else {
            console.log('[AI Service] Using Extracted Text for generation...');
            const finalPrompt = `${strictPrompt}\n\nContent to analyze:\n${extractedText}`;
            result = await model.generateContent(finalPrompt);
        }

        const response = await result.response;
        let text = response.text();
        console.log('[AI Service] RAW GEMINI RESPONSE:', text);
        
        // Response Parsing Fix (Remove markdown blocks)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const aiData = JSON.parse(text);

        // Map to frontend types
        // Map to backend enum values (multiple_choice, checkbox, text, textarea, rating, date, dropdown)
        const typeMap = {
            'radio': 'multiple_choice',
            'checkbox': 'checkbox',
            'dropdown': 'dropdown',
            'text': 'text',
            'textarea': 'textarea',
            'rating': 'rating',
            'date': 'date',
            'signature': 'text' // Fallback for signature if not in enum
        };

        const formattedSurvey = {
            title: aiData.title || 'AI Generated Survey',
            description: aiData.description || '',
            questions: (aiData.questions || []).map((q, idx) => ({
                id: Date.now() + idx,
                question: q.question, // For Backend Schema
                title: q.question,    // For Frontend Display
                type: typeMap[q.type] || 'text',
                required: q.required !== undefined ? q.required : true,
                options: Array.isArray(q.options) ? q.options.map((opt, oIdx) => ({ label: opt, value: opt, order: oIdx + 1 })) : [],
                order: idx + 1
            }))
        };

        res.json({
            success: true,
            data: formattedSurvey
        });
    } catch (error) {
        console.error('[AI Service] Generation Failed:', error);
        res.status(500).json({
            success: false,
            error: { code: 'AI_GENERATION_FAILED', message: error.message }
        });
    }
});

// Mock LLM Response generator
const generateMockSurvey = (content) => {
    const topic = content.replace(/\.[^/.]+$/, "") || 'General Topic';

    return {
        title: `Survey: ${topic}`,
        description: `Survey generated from document: ${content}`,
        questions: [
            {
                type: 'Radio Button',
                question: `What is the primary purpose of this ${topic} form?`,
                required: true,
                order: 1,
                options: 'Registration\nFeedback\nApplication\nOther'
            },
            {
                type: 'Singleline Text Input',
                question: 'Full Name',
                required: true,
                order: 2
            },
            {
                type: 'Rating',
                question: 'How satisfied are you with the layout of this form?',
                required: false,
                order: 3
            },
            {
                type: 'Multiline Text Input',
                question: 'Additional Comments',
                required: false,
                order: 4
            }
        ]
    };
};

/**
 * @route POST /ai/generate
 * @desc Generate survey from text or URL
 */
router.post('/generate', async (req, res) => {
    const { source, sourceType } = req.body;

    if (!source) {
        return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'Source content or URL is required' }
        });
    }

    try {
        let content = source;

        // If source is a URL, fetch the content
        if (sourceType === 'url') {
            try {
                const response = await axios.get(source, { timeout: 5000 });
                // Simple HTML to text (strip tags) - in production use a better parser
                content = response.data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            } catch (fetchError) {
                return res.status(422).json({
                    success: false,
                    error: { code: 'FETCH_ERROR', message: `Could not fetch content from URL: ${fetchError.message}` }
                });
            }
        }

        // Mock AI generation delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const generatedSurvey = generateMockSurvey(content);

        res.json({
            success: true,
            data: generatedSurvey
        });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to generate survey' }
        });
    }
});

module.exports = router;

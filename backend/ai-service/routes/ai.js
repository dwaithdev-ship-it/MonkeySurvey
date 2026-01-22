const express = require('express');
const axios = require('axios');
const router = express.Router();

// Mock LLM Response generator
const generateMockSurvey = (content) => {
    const words = content.split(' ');
    const topic = words.slice(0, 3).join(' ') || 'General Topic';

    return {
        title: `AI Generated: ${topic}`,
        description: `Survey generated from document about ${topic}`,
        category: 'AI Generated',
        tags: ['ai', 'generated'],
        questions: [
            {
                type: 'multiple_choice',
                question: `Based on the text, what is the primary focus of ${topic}?`,
                required: true,
                order: 1,
                options: [
                    { value: 'option1', label: 'Option 1 from context', order: 1 },
                    { value: 'option2', label: 'Option 2 from context', order: 2 },
                    { value: 'option3', label: 'Other', order: 3 }
                ]
            },
            {
                type: 'rating',
                question: `How would you rate the clarity of the information provided about ${topic}?`,
                required: false,
                order: 2
            },
            {
                type: 'textarea',
                question: `What additional questions do you have regarding ${topic}?`,
                required: false,
                order: 3
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

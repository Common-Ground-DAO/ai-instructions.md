require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000, // 60 second timeout
});

app.post('/generate', async (req, res) => {
    try {
        const { projectDescription } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",  // Using 3.5 for faster response
            messages: [
                {
                    role: "system",
                    content: "You are an expert at generating ai-instructions.md files. Generate a clear, well-structured markdown file that helps AI agents understand the project."
                },
                {
                    role: "user",
                    content: projectDescription
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            timeout: 30000 // 30 second timeout
        });

        if (!completion.choices || !completion.choices[0]) {
            throw new Error('Invalid API response');
        }

        res.json({ template: completion.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate template',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/generate', async (req, res) => {
    try {
        const { projectDescription } = req.body;
        
        // Read the template file
        const templatePath = path.join(__dirname, '..', 'template.md');
        const templateContent = await fs.readFile(templatePath, 'utf8');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an expert at generating ai-instructions.md files. Use the following template as your base structure:

${templateContent}

Fill in all placeholders and sections based on the user's project description. Keep the same structure but customize all content to match the specific project. Maintain all formatting, including markdown syntax.`
                },
                {
                    role: "user",
                    content: projectDescription
                }
            ],
            temperature: 0.7,
            max_tokens: 4000, // Increased because the template is longer
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
const { GoogleGenAI, Type, Schema } = require('@google/genai');

// Initialize the client with your API key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateContent = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'job') {
            // Target schema for Job Description
            const jobSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["title", "description", "requirements", "milestones"],
            };

            const prompt = `Generate a professional freelance job post tailored for college students based on these notes: "${data.notes}". Key skills expected: ${data.skills || 'Not specified'}. Keep the language direct and clear.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: jobSchema,
                    temperature: 0.7,
                }
            });

            return res.status(200).json(JSON.parse(response.text));

        } else if (type === 'proposal') {
            // Target schema for Proposal
            const proposalSchema = {
                type: Type.OBJECT,
                properties: {
                    coverLetter: { type: Type.STRING },
                    suggestedMilestones: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["coverLetter", "suggestedMilestones"],
            };

            const prompt = `Write a persuasive freelance job proposal. 
            Job Title: "${data.jobTitle}"
            Job Description: "${data.jobDescription}"
            Applicant Skills & Projects: "${data.userProfile}"
            Write a compelling cover letter emphasizing how the applicant's unique skills and previous project experience directly match the project requirements. Keep it professional and concise.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: proposalSchema,
                    temperature: 0.6,
                }
            });

            return res.status(200).json(JSON.parse(response.text));
        }

        return res.status(400).json({ message: "Invalid generation type specified." });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "AI generation failed. Please try again." });
    }
};
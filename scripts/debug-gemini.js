require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

(async () => {
  const prompt = `Generate 10 technical interview questions for a general professional.

Each question should be multiple choice with 4 options.

Return only valid JSON with either a top-level "questions" or "question" array.

Example:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}
`;

  const candidate = 'models/gemini-flash-latest';

  try {
    const model = genAI.getGenerativeModel({
      model: candidate,
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      systemInstruction: 'Output only valid JSON and nothing else.',
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = typeof response.text === 'function' ? response.text() : response.text?.trim?.() || JSON.stringify(response);

    console.log('RAW TEXT:');
    console.log(text);

    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    console.log('CLEANED TEXT:');
    console.log(cleaned);

    try {
      const parsed = JSON.parse(cleaned);
      console.log('PARSE OK', Array.isArray(parsed) ? 'array' : 'object', Object.keys(parsed));
    } catch (err) {
      console.error('JSON parse failed:', err.message);
    }
  } catch (err) {
    console.error('generateContent failed:', err?.message || err);
    console.error(err);
  }
})();

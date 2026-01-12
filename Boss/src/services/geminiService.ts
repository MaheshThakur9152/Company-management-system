
import { GoogleGenAI } from "@google/genai";

// Replace with your actual API key or use a secure way to store it
const apiKey = "";
const genAI = new GoogleGenAI(apiKey);

export const generateTextResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: "You are Ambe Boss, a highly intelligent, sophisticated, and helpful AI assistant for Hari Sir. You are concise, polite, and efficient. Keep answers short unless asked for details.",
    });

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text() || "I apologize, Hari Sir, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I apologize, Hari Sir, I encountered an error accessing my neural network.";
  }
};

export const getLiveClient = () => {
    return genAI;
}

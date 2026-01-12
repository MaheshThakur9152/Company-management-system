import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTextResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: "You are Ambe Boss, a highly intelligent, sophisticated, and helpful AI assistant for Hari Sir. You are concise, polite, and efficient. Keep answers short unless asked for details.",
      }
    });

    const result: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return result.text || "I apologize, Hari Sir, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I apologize, Hari Sir, I encountered an error accessing my neural network.";
  }
};

export const generateImage = async (prompt: string): Promise<{ imageUrl: string | null, error?: string }> => {
  try {
    // Using gemini-2.5-flash-image as requested in the guide for general generation
    // Although the guide mentions image generation models, typically we need to process the response carefully.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // Nano banana models don't support responseMimeType
      }
    });

    // Check for inline data (image)
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { imageUrl: `data:image/png;base64,${part.inlineData.data}` };
      }
    }
    
    // If no image found in response parts (which can happen if the model refuses or sends text only)
    return { imageUrl: null, error: response.text || "No image generated." };

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return { imageUrl: null, error: "Failed to generate image." };
  }
};

export const getLiveClient = () => {
  return ai;
}

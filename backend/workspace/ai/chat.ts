import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  response: string;
}

// Provides AI-powered assistance for writing and automation.
export const chat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/ai/chat" },
  async (req) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant for a Notion-like workspace app. Help users with writing, organizing, and automating their work. Be concise and practical."
            },
            {
              role: "user",
              content: req.context ? `Context: ${req.context}\n\nUser: ${req.message}` : req.message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      return {
        response: aiResponse,
      };
    } catch (error) {
      console.error('AI chat error:', error);
      return {
        response: "I'm currently unavailable. Please try again later.",
      };
    }
  }
);

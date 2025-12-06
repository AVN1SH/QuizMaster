import { QuizGenerationResult, quizResponseSchema } from "@/schemas/geminiSchemas";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey : process.env.GOOGLE_SDK_KEY});

const modelName = 'gemini-2.5-flash';

export async function POST(req : Request) {
  const {files, instructions} = await req.json();

  try {
    const parts = [];

    for(const file of files) {
      if(file.type.startsWith('text/') || file.type === 'text/plain') {
        parts.push({
          text : `Content of file ${file.name}:\n${file.data}`
        });
      } else {
        parts.push({
          inlineData : {
            mimeType : file.type,
            data : file.data
          }
        });
      }
    }

    parts.push({
    text: `Goal: Generate a quiz based on the provided context and instructions.
      
      User Instructions: "${instructions}"

      Rules:
      1. If the provided documents contain sufficient information to create a quiz, populate the 'quiz' field in the JSON response.
      2. If the provided instruction based on topics then also populate the 'quiz' field in the JSON response.
      3. If the provided instruction contains url and youtubeUrlVideoDetails then also populate the 'quiz' field in the JSON response based on the video details.
      4. If the provided instruction contains url but not the youtubeUrlVideoDetails then do not populate the 'quiz' field in the JSON response and response with error like we might get trouble while analyzing video.
      5. If the user input is gibberish, empty, irrelevant, or if the documents are empty/unreadable, DO NOT generate a quiz. Instead, populate the 'refusalReason' field with a polite apology explaining why (e.g., "I couldn't find enough information in the files to create a quiz about that topic.").
      6. The output must be valid JSON matching the schema.`
    });

    const response = await ai.models.generateContent({
      model : modelName,
      contents : { role : "user", parts },
      config : {
        responseMimeType: "application/json",
        responseSchema: quizResponseSchema,
        systemInstruction: "You are an intelligent educational assistant. Your task is to generate quizzes. You must validate if the user's request and provided context are sufficient before generating. If they are not, you must apologize via the refusalReason field.",
      }
    })

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);

    return NextResponse.json(result as QuizGenerationResult, {status : 200});
  } catch (error) {
    console.error(error);
    return NextResponse.json({refusalReason : "I encountered a technical error while trying to process your request. Please try again."}, {status : 500})
  }
}
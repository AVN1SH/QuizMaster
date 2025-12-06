import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey : process.env.GOOGLE_SDK_KEY});

const modelName = 'gemini-2.5-flash';

export async function POST(req : Request) {
  const {history, newMessage, files} = await req.json();

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
      text: newMessage
    });

    const contents = [...history, { role : "user", parts }];

    const response = await ai.models.generateContent({
      model : modelName,
      contents : contents,
      config : {
        systemInstruction: "You are an intelligent educational assistant. And give response a/c to that message. You can tell user to attempt live quiz by enabling quiz genration option in tools section.",
      }
    })

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return NextResponse.json({text}, {status : 200});
  } catch (error) {
    console.error(error);
    return NextResponse.json({message : "I couldn't generate a response."}, {status : 500})
  }
}
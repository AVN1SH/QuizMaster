import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_SDK_KEY });

const ytkey = process.env.GOOGLE_YT_KEY;

const modelName = 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const ytDetails = await fetch(`https://www.youtube.com/oembed?url=${url[0]}&format=json`);
    
    const data = await ytDetails.json();

    if(!data) return new NextResponse("not get the details")
    
    const searchPrompt = data.title 
      ? `Find the full spoken transcript of the YouTube video titled "${data.title} uploaded on channel ${data.author_name}".`
      : `Find the transcript and content details of the YouTube video at: ${url[0]}.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [{ 
          text: `${searchPrompt}
          TASK:
          1. Search for the actual spoken content of this video.
          2. Ignore results that look like advertisements, product pages, or generic YouTube navigation text.
          3. Return a long article that actually said or taught in the video.
          ` 
        }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    return Response.json({ text: response.text });
  } catch (error) {
    console.log(error, "error................")
    return Response.json("something went wrong.", { status: 500 });
  }
}

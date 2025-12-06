import { extractYoutubeId } from "@/utils/extractYtId";
import { NextResponse } from "next/server";
import { Innertube, UniversalCache } from 'youtubei.js';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    console.log(url[0], "url")
    const videoId = extractYoutubeId(url[0]);
    if(!videoId) return new NextResponse("not get the videoId")

    const youtube = await Innertube.create({
      cache : new UniversalCache(false),
      generate_session_locally : true
    })
    console.log(videoId, "videoId")

    const info = await youtube.getInfo(videoId);
    console.log(info, "info")


    const transcriptData = await info.getTranscript();

    if(!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content || !transcriptData.transcript.content.body) return new NextResponse("not get the transcript")

    const transcript = transcriptData.transcript.content.body.initial_segments.map((segment: any) => ({
      text: segment.snippet.text,
      start: segment.start_ms / 1000, // Convert ms to seconds
      duration: segment.end_ms ? (segment.end_ms - segment.start_ms) / 1000 : 0,
    }));

    const text = transcript.map((segment: any) => segment.text).join(' ');

    return Response.json({ transcript: text });
  } catch (error) {
    return Response.json("something went wrong.", { status: 500 });
  }
}

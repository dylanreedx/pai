// app/api/chat/route.ts
export const runtime = 'edge'; // <-- This forces the Edge runtime for streaming

import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  // Parse the incoming form data from the client.
  const formData = await request.formData();

  // Create a new FormData object to forward to your remote FastAPI endpoint.
  const remoteFormData = new FormData();
  for (const [key, value] of formData.entries()) {
    remoteFormData.append(key, value as Blob | string);
  }

  // Replace with your remote FastAPI endpoint URL (e.g., via ngrok)
  const remoteUrl = 'https://4bd9-98-143-72-77.ngrok-free.app/chat';

  // Forward the request to the remote FastAPI endpoint.
  const res = await fetch(remoteUrl, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
    },
    body: remoteFormData,
  });

  // Return the streaming response with the proper Content-Type.
  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'text/event-stream',
    },
  });
}

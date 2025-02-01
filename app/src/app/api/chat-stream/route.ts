import {NextResponse} from 'next/server';

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const message = searchParams.get('message') || '';

  // Replace this URL with your laptop’s public endpoint.
  // For example, if using ngrok, it might look like:
  // https://your-ngrok-url.ngrok.io/chat/stream
  const backendUrl = `https://4bd9-98-143-72-77.ngrok-free.app/chat/stream?message=${encodeURIComponent(
    message
  )}`;

  // Fetch the streaming response from your laptop endpoint.
  const response = await fetch(backendUrl, {
    headers: {Accept: 'text/event-stream'},
  });

  // Proxy the stream with the correct Content-Type.
  return new NextResponse(response.body, {
    headers: {'Content-Type': 'text/event-stream'},
  });
}

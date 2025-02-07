import {API_URL} from '@/utils/url';
import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the incoming form-data.
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({error: 'File not provided'}, {status: 400});
    }

    // Create a new FormData to forward the file to your remote server.
    const remoteForm = new FormData();
    remoteForm.append('file', file);

    // Forward to your remote server’s endpoint.
    const res = await fetch(API_URL, {
      method: 'POST',
      body: remoteForm,
    });

    // Assume the remote server returns JSON with a "result" field.
    const data = await res.json();
    return NextResponse.json({result: data.result});
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        {error: error.message || 'An error occurred'},
        {status: 500}
      );
    }
    return NextResponse.json(
      {error: 'An unknown error occurred'},
      {status: 500}
    );
  }
}

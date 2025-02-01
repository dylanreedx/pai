'use client';

import {useState} from 'react';
import ReactMarkdown from 'react-markdown';

// ----------------------
// ChatDisplay Component
// ----------------------
function ChatDisplay({
  conversation,
  currentResponse,
}: {
  conversation: string;
  currentResponse: string;
}) {
  // Display both the final conversation and any in-progress streaming text.
  return (
    <div className='flex-1 w-full overflow-y-auto p-6'>
      <ReactMarkdown className='leading-5.5 whitespace-pre-wrap'>
        {conversation + currentResponse}
      </ReactMarkdown>
    </div>
  );
}

// ----------------------
// UnifiedInput Component
// ----------------------
interface UnifiedInputProps {
  onProgress: (chunk: string) => void;
  onComplete: (final: string) => void;
}

function UnifiedInput({onProgress, onComplete}: UnifiedInputProps) {
  const [message, setMessage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }

    // POST the unified form data to your API route which proxies the FastAPI /chat endpoint.
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream', // request a streaming response
      },
      body: formData,
    });
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, {stream: true});
      accumulated += chunk;
      // Report the current accumulated text on every chunk.
      onProgress(accumulated);
    }
    // When done, signal completion.
    onComplete(accumulated);
    setLoading(false);
    // Clear the inputs.
    setMessage('');
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4'>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Enter your message'
        className='p-2 border-[0.5px] border-foreground-lighter bg-foreground-muted rounded-sm shadow-xs'
        rows={3}
      />
      <input
        type='file'
        accept='.pdf'
        onChange={handleFileChange}
        className='p-2 border-[0.5px] border-foreground-lighter bg-foreground-muted rounded-sm shadow-xs w-fit cursor-pointer'
      />
      <button
        type='submit'
        className='px-4 py-2 bg-foreground-lighter text-white rounded-sm hover:bg-foreground hover:text-background transition cursor-pointer'
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

// ----------------------
// Main ChatPage Component
// ----------------------
export default function ChatPage() {
  // conversation holds finalized messages.
  const [conversation, setConversation] = useState<string>('');
  // currentResponse holds the in-progress streaming output.
  const [currentResponse, setCurrentResponse] = useState<string>('');

  // When progress is reported, update currentResponse.
  const handleProgress = (chunk: string) => {
    setCurrentResponse('\n\n**LLM:** ' + chunk);
  };

  // When streaming completes, append the final response to the conversation.
  const handleComplete = (final: string) => {
    setConversation((prev) => prev + '\n\n**LLM:** ' + final + '\n\n');
    setCurrentResponse('');
  };

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Chat display area */}
      <ChatDisplay
        conversation={conversation}
        currentResponse={currentResponse}
      />

      {/* Absolute bottom bar with unified input */}
      <div className='absolute left-0 right-0 bottom-5 mx-auto p-6 rounded shadow max-w-2xl flex flex-col gap-4'>
        <UnifiedInput onProgress={handleProgress} onComplete={handleComplete} />
      </div>
    </div>
  );
}

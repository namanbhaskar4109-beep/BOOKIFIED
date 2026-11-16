import { NextResponse } from 'next/server';
import { searchBookSegments } from '@/lib/actions/book.actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message || body;

    // 1. Handle Vapi Tool Calls (tool-calls event)
    if (message.type === 'tool-calls' && Array.isArray(message.toolCalls)) {
      const results = await Promise.all(
        message.toolCalls.map(async (toolCall: any) => {
          const fn = toolCall.function;
          const rawArgs = typeof fn?.arguments === 'string'
            ? JSON.parse(fn.arguments || '{}')
            : (fn?.arguments || {});

          const query = rawArgs.query || rawArgs.search || rawArgs.question || rawArgs.topic || '';
          const bookId = rawArgs.bookId || rawArgs.book_id || rawArgs.id || message.call?.variableValues?.bookId || '';

          if (!query || !bookId) {
            return {
              toolCallId: toolCall.id,
              result: 'No information found about this topic.',
            };
          }

          // Find the top three matching segments
          const searchResult = await searchBookSegments(bookId, query, 3);

          if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
            return {
              toolCallId: toolCall.id,
              result: 'No information found about this topic.',
            };
          }

          // Combine matching segments' contents into a single string separated by double newlines
          const resultText = searchResult.data
            .map((seg: any) => seg.content)
            .filter(Boolean)
            .join('\n\n');

          return {
            toolCallId: toolCall.id,
            result: resultText || 'No information found about this topic.',
          };
        })
      );

      return NextResponse.json({ results });
    }

    // 2. Handle legacy function-call event
    if (message.type === 'function-call' && message.functionCall) {
      const fn = message.functionCall;
      const rawArgs = typeof fn.parameters === 'string'
        ? JSON.parse(fn.parameters || '{}')
        : (fn.parameters || {});

      const query = rawArgs.query || rawArgs.search || rawArgs.question || rawArgs.topic || '';
      const bookId = rawArgs.bookId || rawArgs.book_id || rawArgs.id || message.call?.variableValues?.bookId || '';

      if (!query || !bookId) {
        return NextResponse.json({
          result: 'No information found about this topic.',
        });
      }

      // Find the top three matching segments
      const searchResult = await searchBookSegments(bookId, query, 3);

      if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
        return NextResponse.json({
          result: 'No information found about this topic.',
        });
      }

      // Combine matching segments' contents into a single string separated by double newlines
      const resultText = searchResult.data
        .map((seg: any) => seg.content)
        .filter(Boolean)
        .join('\n\n');

      return NextResponse.json({
        result: resultText || 'No information found about this topic.',
      });
    }

    // 3. Direct invocation support: { bookId, query } or { parameters: { bookId, query } }
    const directArgs = body.parameters || body.arguments || body;
    const query = directArgs.query || directArgs.search || directArgs.question || directArgs.topic || '';
    const bookId = directArgs.bookId || directArgs.book_id || directArgs.id || '';

    if (query && bookId) {
      const searchResult = await searchBookSegments(bookId, query, 3);
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        const resultText = searchResult.data
          .map((seg: any) => seg.content)
          .filter(Boolean)
          .join('\n\n');
        return NextResponse.json({
          result: resultText || 'No information found about this topic.',
        });
      }
      return NextResponse.json({
        result: 'No information found about this topic.',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Vapi search-book webhook:', error);
    return NextResponse.json(
      { result: 'No information found about this topic.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', route: '/api/vapi/search-book' });
}

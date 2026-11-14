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
            ? JSON.parse(fn.arguments)
            : (fn?.arguments || {});

          const query = rawArgs.query || rawArgs.search || rawArgs.question || '';
          const bookId = rawArgs.bookId || message.call?.variableValues?.bookId || '';

          if (!query || !bookId) {
            return {
              toolCallId: toolCall.id,
              result: 'Please specify both a bookId and a query to search the book.',
            };
          }

          const searchResult = await searchBookSegments(bookId, query, 4);

          if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
            return {
              toolCallId: toolCall.id,
              result: 'No matching passages found in the book for this query.',
            };
          }

          const passages = searchResult.data
            .map((seg: any) => `(Page ${seg.pageNumber || 'N/A'}, Segment ${seg.segmentIndex + 1}):\n${seg.content}`)
            .join('\n\n');

          return {
            toolCallId: toolCall.id,
            result: passages,
          };
        })
      );

      return NextResponse.json({ results });
    }

    // 2. Handle legacy function-call event
    if (message.type === 'function-call' && message.functionCall) {
      const fn = message.functionCall;
      const rawArgs = typeof fn.parameters === 'string'
        ? JSON.parse(fn.parameters)
        : (fn.parameters || {});

      const query = rawArgs.query || rawArgs.search || rawArgs.question || '';
      const bookId = rawArgs.bookId || message.call?.variableValues?.bookId || '';

      if (!query || !bookId) {
        return NextResponse.json({
          result: 'Please specify both a bookId and a query to search the book.',
        });
      }

      const searchResult = await searchBookSegments(bookId, query, 4);
      const passages = searchResult.success && searchResult.data && searchResult.data.length > 0
        ? searchResult.data.map((seg: any) => seg.content).join('\n\n')
        : 'No matching passages found in the book for this query.';

      return NextResponse.json({ result: passages });
    }

    // 3. Acknowledge other Vapi events (e.g. status-update, end-of-call-report)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Vapi webhook request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'Bookefy Vapi Webhook' });
}

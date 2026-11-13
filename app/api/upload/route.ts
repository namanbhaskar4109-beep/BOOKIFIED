import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES, MAX_FILE_SIZE } from '@/lib/constants';

export async function POST(request: Request): Promise<NextResponse> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('Upload error: BLOB_READ_WRITE_TOKEN is not configured in .env.local');
        return NextResponse.json(
            { error: 'BLOB_READ_WRITE_TOKEN is missing in environment variables. Please add it to .env.local.' },
            { status: 500 }
        );
    }

    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            body,
            request,
            onBeforeGenerateToken: async () => {
                const { userId } = await auth();

                if (!userId) {
                    throw new Error('Unauthorized: User not authenticated');
                }

                return {
                    allowedContentTypes: [...ACCEPTED_PDF_TYPES, ...ACCEPTED_IMAGE_TYPES],
                    addRandomSuffix: true,
                    maximumSizeInBytes: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({ userId }),
                };
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        const status = message.includes('Unauthorized') ? 401 : 400;
        console.error('Upload error:', error);
        return NextResponse.json({ error: message }, { status });
    }
}

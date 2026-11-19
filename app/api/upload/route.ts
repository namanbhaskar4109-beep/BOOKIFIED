import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { HandleUploadBody } from '@vercel/blob/client';
import * as path from 'path';
import * as fs from 'fs';
import { MAX_FILE_SIZE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized: User not authenticated' },
                { status: 401 }
            );
        }

        const contentType = request.headers.get('content-type') || '';

        // 1. Handle multipart/form-data upload (Direct upload with Vercel Blob + Local Fallback)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json(
                    { error: 'No file provided in form data' },
                    { status: 400 }
                );
            }

            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File size exceeds maximum allowed limit (${MAX_FILE_SIZE / (1024 * 1024)}MB)` },
                    { status: 400 }
                );
            }

            // A) If Vercel Blob token is configured, attempt upload to Vercel Blob
            if (process.env.BLOB_READ_WRITE_TOKEN) {
                try {
                    const { put } = await import('@vercel/blob');
                    const blob = await put(file.name, file, {
                        access: 'public',
                        token: process.env.BLOB_READ_WRITE_TOKEN,
                    });

                    return NextResponse.json({
                        url: blob.url,
                        pathname: blob.pathname,
                    });
                } catch (blobError) {
                    console.warn(
                        'Vercel Blob upload failed. Falling back to local storage:',
                        blobError
                    );
                }
            }

            // B) Local storage fallback (Works out-of-the-box without external cloud token)
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.promises.mkdir(uploadsDir, { recursive: true });

            const ext = path.extname(file.name) || '';
            const baseName = path
                .basename(file.name, ext)
                .replace(/[^a-zA-Z0-9_-]/g, '_');
            const safeFileName = `${baseName}-${Date.now().toString(36)}${ext}`;
            const filePath = path.join(uploadsDir, safeFileName);

            const fileBuffer = Buffer.from(await file.arrayBuffer());
            await fs.promises.writeFile(filePath, fileBuffer);

            return NextResponse.json({
                url: `/api/files/${safeFileName}`,
                pathname: safeFileName,
            });
        }

        // 2. Handle JSON requests from @vercel/blob client handleUpload (if token is available)
        if (contentType.includes('application/json')) {
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                return NextResponse.json(
                    {
                        error: 'BLOB_READ_WRITE_TOKEN is not configured for client token generation. Please use direct multipart upload to /api/upload.',
                    },
                    { status: 400 }
                );
            }

            const { handleUpload } = await import('@vercel/blob/client');
            const body = (await request.json()) as HandleUploadBody;

            const jsonResponse = await handleUpload({
                token: process.env.BLOB_READ_WRITE_TOKEN,
                body,
                request,
                onBeforeGenerateToken: async () => {
                    return {
                        allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                        addRandomSuffix: true,
                        maximumSizeInBytes: MAX_FILE_SIZE,
                        tokenPayload: JSON.stringify({ userId }),
                    };
                },
            });

            return NextResponse.json(jsonResponse);
        }

        return NextResponse.json(
            { error: 'Unsupported Content-Type. Please send multipart/form-data.' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Upload error in /api/upload:', error);
        const message = error instanceof Error ? error.message : 'An unknown upload error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

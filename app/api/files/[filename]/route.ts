import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await context.params;

        if (!filename) {
            return new NextResponse('Filename is required', { status: 400 });
        }

        // Prevent path traversal
        const safeFilename = path.basename(filename);
        const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = await fs.promises.readFile(filePath);

        let contentType = 'application/octet-stream';
        const lower = safeFilename.toLowerCase();
        if (lower.endsWith('.pdf')) {
            contentType = 'application/pdf';
        } else if (lower.endsWith('.png')) {
            contentType = 'image/png';
        } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
            contentType = 'image/jpeg';
        } else if (lower.endsWith('.webp')) {
            contentType = 'image/webp';
        }

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${safeFilename}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

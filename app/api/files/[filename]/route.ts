import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import { connectToDatabase } from '@/database/mongoose';
import mongoose from 'mongoose';

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

        const safeFilename = path.basename(filename);
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

        // 1. Check local disk first (fast in local development)
        try {
            const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);
            if (fs.existsSync(filePath)) {
                const fileBuffer = await fs.promises.readFile(filePath);
                return new NextResponse(fileBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `inline; filename="${safeFilename}"`,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }
        } catch {
            // Read-only filesystem on Vercel; proceed to MongoDB GridFS below
        }

        // 2. Fetch from MongoDB GridFS (Works across all Vercel Serverless instances)
        await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) {
            return new NextResponse('Database connection error', { status: 500 });
        }

        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
        const files = await bucket.find({ filename: safeFilename }).limit(1).toArray();

        if (!files || files.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        const downloadStream = bucket.openDownloadStreamByName(safeFilename);
        const chunks: Buffer[] = [];

        await new Promise((resolve, reject) => {
            downloadStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            downloadStream.on('end', resolve);
            downloadStream.on('error', reject);
        });

        const fileBuffer = Buffer.concat(chunks);
        const finalContentType = (files[0] as any).contentType || contentType;

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': finalContentType,
                'Content-Disposition': `inline; filename="${safeFilename}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, ImageIcon, X, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadSchema } from '@/lib/zod';
import { BookUploadFormValues } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ACCEPTED_PDF_TYPES, ACCEPTED_IMAGE_TYPES, DEFAULT_VOICE } from '@/lib/constants';
import VoiceSelector from './VoiceSelector';
import LoadingOverlay from './LoadingOverlay';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { checkBookExists, createBook, saveBookSegments } from '@/lib/actions/book.actions';
import { useRouter } from 'next/navigation';
import { parsePDFFile, uploadCoverBlob } from '@/lib/client-utils';
import { upload } from '@vercel/blob/client';

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingStep, setLoadingStep] = useState('Parsing & preparing book...');
    const [isMounted, setIsMounted] = useState(false);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const { userId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            voice: DEFAULT_VOICE,
            file: undefined,
            coverImage: undefined,
        },
    });

    const pdfFile = form.watch('file');
    const coverFile = form.watch('coverImage');

    const onSubmit = async (data: BookUploadFormValues) => {
        if (!userId) {
            return toast.error('Please login to upload books');
        }

        setIsSubmitting(true);
        setLoadingStep('Checking for existing books...');

        try {
            const existsCheck = await checkBookExists(data.title, userId);

            if (existsCheck.error) {
                const err = typeof existsCheck.error === 'string' ? existsCheck.error : 'Database connection error';
                toast.error(`Database error: ${err}`);
                return;
            }

            if (existsCheck.exists && existsCheck.book) {
                toast.info('A book with this title already exists.');
                form.reset();
                router.push('/');
                return;
            }

            setLoadingStep('Parsing PDF & extracting text segments...');
            const parsedPDF = await parsePDFFile(data.file);

            if (parsedPDF.content.length === 0) {
                toast.error('Failed to parse PDF. Please try again with a different file.');
                return;
            }

            const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase();

            setLoadingStep('Uploading PDF to storage...');
            const uploadedPdfBlob = await upload(fileTitle, data.file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
                contentType: 'application/pdf',
            });

            setLoadingStep('Uploading cover image...');
            const coverUrl = await uploadCoverBlob(fileTitle, data.coverImage, parsedPDF.cover);

            setLoadingStep('Creating book in library...');
            const bookResult = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.voice,
                fileURL: uploadedPdfBlob.url,
                fileBlobKey: uploadedPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: data.file.size,
            });

            if (!bookResult || !bookResult.success) {
                const err = typeof bookResult?.error === 'string' ? bookResult.error : 'Failed to create book';
                if (err.includes('MongoDB') || err.includes('EREFUSED') || err.includes('ServerSelectionError')) {
                    toast.error('Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0).');
                } else {
                    toast.error(err);
                }
                return;
            }

            if (bookResult.alreadyExists) {
                toast.info('A book with this title already exists.');
                form.reset();
                router.push('/');
                return;
            }

            setLoadingStep('Saving text segments for AI reading...');
            const segmentsResult = await saveBookSegments(
                bookResult.data._id,
                userId,
                parsedPDF.content
            );

            if (!segmentsResult.success) {
                toast.error('Book created, but failed to save segments.');
            } else {
                toast.success(`"${data.title}" added to your library!`);
            }

            setLoadingStep('Redirecting to home page...');
            form.reset();
            router.refresh();
            router.push('/');
        } catch (error) {
            console.error('Upload error:', error);
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('retrieve the client token') || msg.includes('BLOB_READ_WRITE_TOKEN')) {
                toast.error('Vercel Blob token missing: Please set BLOB_READ_WRITE_TOKEN in .env.local');
            } else {
                toast.error(msg || 'Failed to upload book. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <>
            {isSubmitting && <LoadingOverlay isLoading={isSubmitting} statusText={loadingStep} />}

            <div className="new-book-wrapper">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* 1. PDF File Upload */}
                        <FormField
                            control={form.control}
                            name="file"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Book PDF</FormLabel>
                                    <FormControl>
                                        <div
                                            onClick={() => pdfInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const droppedFile = e.dataTransfer.files?.[0];
                                                if (droppedFile) {
                                                    field.onChange(droppedFile);
                                                }
                                            }}
                                            className={cn(
                                                'upload-dropzone border-2 border-dashed border-[#d4c4a8] relative',
                                                pdfFile && 'upload-dropzone-uploaded border-[#8B7355]'
                                            )}
                                        >
                                            <input
                                                ref={pdfInputRef}
                                                type="file"
                                                accept={ACCEPTED_PDF_TYPES.join(',')}
                                                className="hidden"
                                                disabled={isSubmitting}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        field.onChange(file);
                                                    }
                                                }}
                                            />

                                            {pdfFile ? (
                                                <div className="flex flex-col items-center p-4">
                                                    <FileText className="upload-dropzone-icon text-[#663820]" />
                                                    <p className="upload-dropzone-text font-semibold line-clamp-1 max-w-[90%]">
                                                        {pdfFile.name}
                                                    </p>
                                                    <p className="upload-dropzone-hint">
                                                        {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            field.onChange(undefined);
                                                            if (pdfInputRef.current) {
                                                                pdfInputRef.current.value = '';
                                                            }
                                                        }}
                                                        className="upload-dropzone-remove absolute top-3 right-3"
                                                        title="Remove file"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="upload-dropzone-icon" />
                                                    <p className="upload-dropzone-text">Click to upload PDF</p>
                                                    <p className="upload-dropzone-hint">PDF file (max 50MB)</p>
                                                </>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 2. Cover Image Upload */}
                        <FormField
                            control={form.control}
                            name="coverImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Cover Image</FormLabel>
                                    <FormControl>
                                        <div
                                            onClick={() => coverInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const droppedFile = e.dataTransfer.files?.[0];
                                                if (droppedFile) {
                                                    field.onChange(droppedFile);
                                                }
                                            }}
                                            className={cn(
                                                'upload-dropzone border-2 border-dashed border-[#d4c4a8] relative',
                                                coverFile && 'upload-dropzone-uploaded border-[#8B7355]'
                                            )}
                                        >
                                            <input
                                                ref={coverInputRef}
                                                type="file"
                                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                                className="hidden"
                                                disabled={isSubmitting}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        field.onChange(file);
                                                    }
                                                }}
                                            />

                                            {coverFile ? (
                                                <div className="flex flex-col items-center p-4">
                                                    <CheckCircle2 className="upload-dropzone-icon text-[#663820]" />
                                                    <p className="upload-dropzone-text font-semibold line-clamp-1 max-w-[90%]">
                                                        {coverFile.name}
                                                    </p>
                                                    <p className="upload-dropzone-hint">
                                                        {(coverFile.size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            field.onChange(undefined);
                                                            if (coverInputRef.current) {
                                                                coverInputRef.current.value = '';
                                                            }
                                                        }}
                                                        className="upload-dropzone-remove absolute top-3 right-3"
                                                        title="Remove cover"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon className="upload-dropzone-icon" />
                                                    <p className="upload-dropzone-text">Click to upload cover image</p>
                                                    <p className="upload-dropzone-hint">
                                                        Leave empty to auto-generate from PDF
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 3. Title Input */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Title</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            className="form-input border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-[#663820]"
                                            placeholder="ex: Rich Dad Poor Dad"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 4. Author Input */}
                        <FormField
                            control={form.control}
                            name="author"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Author Name</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            className="form-input border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-[#663820]"
                                            placeholder="ex: Robert Kiyosaki"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 5. Voice Selector */}
                        <FormField
                            control={form.control}
                            name="voice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                                    <FormControl>
                                        <VoiceSelector
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 6. Submit Button */}
                        <Button type="submit" className="form-btn" disabled={isSubmitting}>
                            Begin Synthesis
                        </Button>
                    </form>
                </Form>
            </div>
        </>
    );
};

export default UploadForm;

'use server';

import { CreateBook, CreateBookResult, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { revalidatePath } from "next/cache";
import { checkBookUploadLimit } from "@/lib/subscription.server";

export const createBook = async (data: CreateBook): Promise<CreateBookResult> => {
    try {
        await connectToDatabase();

        let slug = generateSlug(data.title);

        // Check if this specific user already uploaded this book
        const existingUserBook = await Book.findOne({ slug, clerkId: data.clerkId }).lean();

        if (existingUserBook) {
            return {
                success: true,
                data: serializeData(existingUserBook),
                alreadyExists: true,
            };
        }

        // Enforce Clerk Billing plan limits on book uploads
        const uploadCheck = await checkBookUploadLimit(data.clerkId);
        if (!uploadCheck.allowed) {
            return {
                success: false,
                error: uploadCheck.error,
                isBillingError: true,
            };
        }

        // If another user already has this slug, make it unique for this user
        const existingSlugBook = await Book.findOne({ slug }).lean();
        if (existingSlugBook) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        const newBook = await Book.create({
            ...data,
            slug,
            totalSegments: 0,
        });

        revalidatePath('/');

        return {
            success: true,
            data: serializeData(newBook),
            alreadyExists: false,
        };
    } catch (e) {
        console.error("Error creating book:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    try {
        await connectToDatabase();

        console.log('Saving book segments...');

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
            clerkId,
            bookId,
            content: text,
            segmentIndex,
            pageNumber,
            wordCount,
        }));

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log('Book segments saved successfully.');

        revalidatePath('/');

        return {
            success: true,
            data: { segmentsCreated: segments.length },
        };
    } catch (e) {
        console.error('Error saving book segments:', e);

        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};

export const checkBookExists = async (title: string, clerkId?: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const filter: Record<string, any> = { slug };
        if (clerkId) {
            filter.clerkId = clerkId;
        }

        const existingBook = await Book.findOne(filter).lean();

        if (existingBook) {
            return {
                exists: true,
                book: serializeData(existingBook),
            };
        }

        return {
            exists: false,
        };
    } catch (e) {
        console.error('Error checking book exists:', e);
        return {
            exists: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};

export interface GetAllBooksOptions {
    limit?: number;
    query?: string;
    clerkId?: string;
}

export const getAllBooks = async (options: GetAllBooksOptions = {}) => {
    try {
        if (!process.env.MONGODB_URI) {
            return {
                success: false,
                data: [],
            };
        }
        await connectToDatabase();

        const filter: Record<string, any> = {};

        if (options.clerkId) {
            filter.clerkId = options.clerkId;
        }

        if (options.query) {
            const regex = new RegExp(escapeRegex(options.query), 'i');
            filter.$or = [{ title: regex }, { author: regex }];
        }

        let query = Book.find(filter).sort({ createdAt: -1 }).lean();

        if (options.limit && options.limit > 0) {
            query = query.limit(options.limit);
        }

        const books = await query;

        return {
            success: true,
            data: serializeData(books),
        };
    } catch (e) {
        console.error('Error fetching books:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
            data: [],
        };
    }
};

export const getAllBook = async (options: GetAllBooksOptions = {}) => {
    return getAllBooks(options);
};

export const getBookBySlug = async (slug: string, clerkId?: string) => {
    try {
        if (process.env.MONGODB_URI) {
            await connectToDatabase();
            const filter: Record<string, any> = { slug };
            if (clerkId) {
                filter.clerkId = clerkId;
            }
            const book = await Book.findOne(filter).lean();
            if (book) {
                return {
                    success: true,
                    data: serializeData(book),
                };
            }
        }
    } catch (e) {
        console.error('Error fetching book by slug:', e);
    }

    return {
        success: false,
        error: 'Book not found',
    };
};

export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
    try {
        await connectToDatabase();

        // 1. Attempt MongoDB text index search
        let segments = await BookSegment.find(
            { bookId, $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();

        // 2. Fallback to regex substring search if text query returns no results
        if (!segments || segments.length === 0) {
            const regex = new RegExp(escapeRegex(query), 'i');
            segments = await BookSegment.find({
                bookId,
                content: regex,
            })
                .limit(limit)
                .lean();
        }

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (e) {
        console.error('Error searching book segments:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
            data: [],
        };
    }
};

export const getBookSegments = async (bookId: string) => {
    try {
        await connectToDatabase();
        const segments = await BookSegment.find({ bookId })
            .sort({ segmentIndex: 1 })
            .lean();

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (e) {
        console.error('Error fetching segments:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
            data: [],
        };
    }
};

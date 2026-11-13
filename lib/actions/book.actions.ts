'use server';

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { revalidatePath } from "next/cache";

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            };
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

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();

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

export const getAllBooks = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            return {
                success: false,
                data: [],
            };
        }
        await connectToDatabase();
        const books = await Book.find().sort({ createdAt: -1 }).lean();
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

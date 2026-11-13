import { Schema, model, models } from 'mongoose';
import { IBookSegment } from '@/types';

const bookSegmentSchema = new Schema<IBookSegment>({
    clerkId: { type: String, required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    content: { type: String, required: true },
    segmentIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    wordCount: { type: Number, required: true },
}, { timestamps: true });

bookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });
bookSegmentSchema.index({ bookId: 1, pageNumber: 1 });
bookSegmentSchema.index({ content: 'text' });

const BookSegment = models.BookSegment || model<IBookSegment>('BookSegment', bookSegmentSchema);

export default BookSegment;


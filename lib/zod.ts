import { z } from 'zod';

export const UploadSchema = z.object({
  file: z.custom<File>(
    (val) => typeof window !== 'undefined' && val instanceof File,
    'PDF file is required'
  ),
  coverImage: z
    .custom<File>((val) => typeof window === 'undefined' || val instanceof File)
    .optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  author: z.string().min(1, 'Author Name is required').max(100, 'Author cannot exceed 100 characters'),
  voice: z.string().min(1, 'Please choose an assistant voice'),
});

export type UploadSchemaType = z.infer<typeof UploadSchema>;

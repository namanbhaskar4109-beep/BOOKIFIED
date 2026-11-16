'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BookCardProps } from '@/types';
import { deleteBook } from '@/lib/actions/book.actions';

export const BookCard = ({ id, title, author, coverURL, slug }: BookCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This will permanently remove the book and all voice sessions.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const res = await deleteBook(id);
      if (res.success) {
        toast.success(`"${title}" deleted successfully`);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete book');
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      toast.error('Failed to delete book. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/books/${slug}`} className="group relative block">
      <article className="book-card relative transition-all duration-200 group-hover:-translate-y-1">
        {/* Delete Button */}
        {id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete ${title}`}
            title="Delete book"
            className="absolute top-2 right-2 z-10 size-8 rounded-full bg-white/90 hover:bg-red-50 hover:text-red-600 text-gray-500 shadow-sm flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all border border-gray-200 hover:border-red-300"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin text-red-500" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        )}

        <figure className="book-card-figure">
          <div className="book-card-cover-wrapper">
            <Image
              src={coverURL || '/assets/book-cover-placeholder.png'}
              alt={title}
              className="book-card-cover"
              width={133}
              height={200}
            />
          </div>
        </figure>
        <figcaption className="book-card-meta">
          <h3 className="book-card-title">{title}</h3>
          <p className="book-card-author">{author}</p>
        </figcaption>
      </article>
    </Link>
  );
};

export default BookCard;

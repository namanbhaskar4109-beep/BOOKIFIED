import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { LibraryHero } from '@/components/HeroSection';
import { BookCard } from '@/components/BookCard';
import { getAllBooks } from '@/lib/actions/book.actions';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = await auth();

  let dbBooks: any[] = [];
  if (userId) {
    const result = await getAllBooks({ clerkId: userId });
    dbBooks = result?.success && result.data ? result.data : [];
  }

  const allBooks = dbBooks;

  return (
    <main className="wrapper container flex flex-col gap-10">
      <LibraryHero />

      {allBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[var(--border-subtle)] text-center my-4 shadow-xs">
          <div className="size-16 rounded-full bg-[#f3e4c7]/60 flex items-center justify-center mb-4 text-[#663820]">
            <BookOpen className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-[#212a3b] mb-2 font-serif">
            No books in your library yet
          </h2>
          <p className="text-[#3d485e] max-w-md text-sm mb-6">
            Upload your first book or PDF to start listening and chatting with natural AI voice personas.
          </p>
          <Link href="/books/new" className="library-cta-primary inline-flex items-center gap-2">
            <Plus className="size-4" />
            <span>Upload Your First Book</span>
          </Link>
        </div>
      ) : (
        <div className="library-books-grid">
          {allBooks.map((book) => (
            <BookCard
              key={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL}
              slug={book.slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}

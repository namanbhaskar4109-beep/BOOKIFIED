import { LibraryHero } from '@/components/HeroSection'
import { sampleBooks } from '@/lib/constants'
import { BookCard } from '@/components/BookCard'
import { getAllBooks } from '@/lib/actions/book.actions'

export const dynamic = 'force-dynamic';

export default async function Page() {
  const result = await getAllBooks();
  const dbBooks = result?.success && result.data ? result.data : [];
  const allBooks = [...dbBooks, ...sampleBooks];

  return (
    <main className="wrapper container flex flex-col gap-10">
      <LibraryHero />
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
    </main>
  )
}

import { LibraryHero } from '@/components/HeroSection'
import { sampleBooks } from '@/lib/constants'
import { BookCard } from '@/components/BookCard'

export default function Page() {
  return (
    <main className="wrapper container flex flex-col gap-10">
      <LibraryHero />
      <div className="library-books-grid">
        {sampleBooks.map((book) => (
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

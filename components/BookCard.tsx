import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { BookCardProps } from '@/types'

export const BookCard = ({ title, author, coverURL, slug }: BookCardProps) => {
  return (
    <Link href={`/books/${slug}`}>
      <article className="book-card">
        <figure className="book-card-figure">
          <div className="book-card-cover-wrapper">
            <Image
              src={coverURL}
              alt={title}
              className="book-card-cover"
              width={133}
              height={200}
            />
          </div>
        </figure>
        <div className="book-card-meta">
          <h3 className="book-card-title">{title}</h3>
          <p className="book-card-author">{author}</p>
        </div>
      </article>
    </Link>
  )
}

export default BookCard

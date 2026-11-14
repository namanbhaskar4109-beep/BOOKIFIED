import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ArrowLeft } from 'lucide-react';
import { getBookBySlug } from '@/lib/actions/book.actions';
import VapiControls from '@/components/VapiControls';

interface BookPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BookPageProps) {
  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    return { title: 'Book | Bookified' };
  }

  return {
    title: `${result.data.title} | Bookified`,
    description: `Interactive AI voice session for ${result.data.title} by ${result.data.author}`,
  };
}

export default async function BookDetailsPage({ params }: BookPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect('/');
  }

  const book = result.data;

  return (
    <div className="book-page-container relative">
      {/* Floating Back Button */}
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft className="w-5 h-5 text-[#212a3b]" />
      </Link>

      <main className="w-full max-w-4xl mx-auto">
        <VapiControls book={book} />
      </main>
    </div>
  );
}

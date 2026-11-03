import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Plus } from 'lucide-react'

const steps = [
  {
    step: '1',
    title: 'Upload your PDF',
    description: 'Add any book to your personal library'
  },
  {
    step: '2',
    title: 'Pick a voice',
    description: 'Select from natural AI voice personas'
  },
  {
    step: '3',
    title: 'Listen and chat',
    description: 'Engage in real-time conversation'
  }
]

export const LibraryHero = () => {
  return (
    <section className="library-hero-card">
      <div className="library-hero-content">
        {/* Left: Heading, Description, and Add New Book CTA */}
        <div className="library-hero-text">
          <h1 className="library-hero-title">Your Library</h1>
          <p className="library-hero-description">
            Upload your favorite books, customize their AI companion voices, and listen or chat with them anytime.
          </p>
          <Link href="/books/new" className="library-cta-primary">
            <Plus className="w-5 h-5" />
            <span>Add New Book</span>
          </Link>
        </div>

        {/* Center: Vintage Books and Globe Illustration (Desktop) */}
        <div className="library-hero-illustration-desktop">
          <Image
            src="/assets/hero-illustration.png"
            alt="Vintage books and globe illustration"
            width={340}
            height={231}
            className="object-contain max-h-[250px] w-auto drop-shadow-sm select-none pointer-events-none"
            priority
          />
        </div>

        {/* Center: Illustration (Mobile) */}
        <div className="library-hero-illustration">
          <Image
            src="/assets/hero-illustration.png"
            alt="Vintage books and globe illustration"
            width={240}
            height={163}
            className="object-contain max-h-[180px] w-auto drop-shadow-sm select-none pointer-events-none"
            priority
          />
        </div>

        {/* Right: Small white card showing 3 numbered steps */}
        <div className="library-steps-card flex flex-col gap-3 min-w-[280px] lg:max-w-[320px] w-full lg:w-auto shadow-sm">
          {steps.map(({ step, title, description }) => (
            <div key={step} className="library-step-item">
              <span className="library-step-number">{step}</span>
              <div>
                <h3 className="library-step-title">{title}</h3>
                <p className="library-step-description">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LibraryHero

import UploadForm from '@/components/UploadForm'
import React from 'react'

const NewBookPage = () => {
  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="flex flex-col gap-3 text-center sm:text-left">
          <h1 className="page-title-xl">Add New Book</h1>
          <p className="subtitle">
            Upload a PDF to generate your interactive AI reading experience
          </p>
        </section>

        <UploadForm />
      </div>
    </main>
  )
}

export default NewBookPage

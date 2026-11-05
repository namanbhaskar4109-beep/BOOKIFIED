'use client'

import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, ImageIcon, X, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from 'cn'
import { UploadSchema, type UploadSchemaType } from '@/lib/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { VoiceSelector } from '@/components/VoiceSelector'
import { LoadingOverlay } from '@/components/LoadingOverlay'

export const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingStep, setLoadingStep] = useState('Uploading & analyzing PDF...')
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<UploadSchemaType>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: '',
      author: '',
      voice: 'rachel',
    },
  })

  const pdfFile = form.watch('file')
  const coverFile = form.watch('coverImage')

  const onSubmit = async (values: UploadSchemaType) => {
    setIsSubmitting(true)
    try {
      setLoadingStep('Uploading PDF & extracting text segments...')
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setLoadingStep('Synthesizing voice persona & creating interactive index...')
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log('Book submission values:', values)
      // Redirect or success handling can be hooked in here
    } catch (error) {
      console.error('Error during synthesis:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting}
        title="Synthesizing Your Book..."
        statusText={loadingStep}
      />

      <div className="new-book-wrapper">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. PDF File Upload */}
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Book PDF</FormLabel>
                  <FormControl>
                    <div
                      onClick={() => pdfInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const droppedFile = e.dataTransfer.files?.[0]
                        if (droppedFile) {
                          field.onChange(droppedFile)
                        }
                      }}
                      className={cn(
                        'upload-dropzone border-2 border-dashed border-[#d4c4a8] relative',
                        pdfFile && 'upload-dropzone-uploaded border-[#8B7355]'
                      )}
                    >
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            field.onChange(file)
                          }
                        }}
                      />

                      {pdfFile ? (
                        <div className="flex flex-col items-center p-4">
                          <FileText className="upload-dropzone-icon text-[#663820]" />
                          <p className="upload-dropzone-text font-semibold line-clamp-1 max-w-[90%]">
                            {pdfFile.name}
                          </p>
                          <p className="upload-dropzone-hint">
                            {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              field.onChange(undefined)
                              if (pdfInputRef.current) {
                                pdfInputRef.current.value = ''
                              }
                            }}
                            className="upload-dropzone-remove absolute top-3 right-3"
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="upload-dropzone-icon" />
                          <p className="upload-dropzone-text">Click to upload PDF</p>
                          <p className="upload-dropzone-hint">PDF file (max 50MB)</p>
                        </>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Cover Image Upload */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Cover Image</FormLabel>
                  <FormControl>
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const droppedFile = e.dataTransfer.files?.[0]
                        if (droppedFile) {
                          field.onChange(droppedFile)
                        }
                      }}
                      className={cn(
                        'upload-dropzone border-2 border-dashed border-[#d4c4a8] relative',
                        coverFile && 'upload-dropzone-uploaded border-[#8B7355]'
                      )}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            field.onChange(file)
                          }
                        }}
                      />

                      {coverFile ? (
                        <div className="flex flex-col items-center p-4">
                          <CheckCircle2 className="upload-dropzone-icon text-[#663820]" />
                          <p className="upload-dropzone-text font-semibold line-clamp-1 max-w-[90%]">
                            {coverFile.name}
                          </p>
                          <p className="upload-dropzone-hint">
                            {(coverFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              field.onChange(undefined)
                              if (coverInputRef.current) {
                                coverInputRef.current.value = ''
                              }
                            }}
                            className="upload-dropzone-remove absolute top-3 right-3"
                            title="Remove cover"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="upload-dropzone-icon" />
                          <p className="upload-dropzone-text">
                            Click to upload cover image
                          </p>
                          <p className="upload-dropzone-hint">
                            Leave empty to auto-generate from PDF
                          </p>
                        </>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Title Input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Title</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      type="text"
                      className="form-input border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-[#663820]"
                      placeholder="ex: Rich Dad Poor Dad"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Author Input */}
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Author Name</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      type="text"
                      className="form-input border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-[#663820]"
                      placeholder="ex: Robert Kiyosaki"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Voice Selector */}
            <FormField
              control={form.control}
              name="voice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                  <FormControl>
                    <VoiceSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-btn disabled:opacity-50"
            >
              Begin Synthesis
            </button>
          </form>
        </Form>
      </div>
    </>
  )
}

export default UploadForm

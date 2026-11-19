'use client';

import { splitIntoSegments } from '@/lib/utils';

export async function parsePDFFile(file: File) {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    // Render first page as cover image
    const firstPage = await pdfDocument.getPage(1);
    const viewport = firstPage.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    await firstPage.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    const coverDataURL = canvas.toDataURL('image/png');

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
        .join(' ');
      fullText += pageText + '\n';
    }

    const segments = splitIntoSegments(fullText);

    await loadingTask.destroy();

    return {
      content: segments,
      cover: coverDataURL,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function uploadFile(
  fileOrBlob: File | Blob,
  fileName: string,
): Promise<{ url: string; pathname: string }> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, fileName);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${res.status}`);
  }

  return await res.json();
}

export async function uploadCoverBlob(
  fileTitle: string,
  coverImage?: File,
  fallbackCoverDataUrl?: string,
): Promise<string> {
  if (coverImage) {
    const uploaded = await uploadFile(coverImage, `${fileTitle}_cover.png`);
    return uploaded.url;
  }

  if (fallbackCoverDataUrl) {
    const response = await fetch(fallbackCoverDataUrl);
    const blob = await response.blob();

    const uploaded = await uploadFile(blob, `${fileTitle}_cover.png`);
    return uploaded.url;
  }

  throw new Error('No cover image or fallback cover data URL provided');
}

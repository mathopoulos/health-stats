export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export async function* createFileChunks(file: File) {
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    offset += CHUNK_SIZE;
    const chunkNumber = Math.floor(offset / CHUNK_SIZE);
    const isLastChunk = offset >= file.size;
    
    yield {
      chunk,
      chunkNumber,
      isLastChunk,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE)
    };
  }
}

export async function uploadChunk(
  chunk: Blob,
  chunkNumber: number,
  totalChunks: number,
  isLastChunk: boolean,
  fileName: string
) {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkNumber', chunkNumber.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('isLastChunk', isLastChunk.toString());
  formData.append('fileName', fileName);

  const response = await fetch('/api/upload-chunk', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload chunk ${chunkNumber}`);
  }

  return response.json();
} 
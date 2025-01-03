export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export async function* createFileChunks(file: File) {
  let offset = 0;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  console.log('Creating chunks for file:', {
    fileName: file.name,
    fileSize: file.size,
    totalChunks,
    chunkSize: CHUNK_SIZE
  });

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    offset += CHUNK_SIZE;
    const chunkNumber = Math.floor(offset / CHUNK_SIZE);
    const isLastChunk = offset >= file.size;
    
    console.log(`Preparing chunk ${chunkNumber}/${totalChunks}`, {
      chunkSize: chunk.size,
      offset,
      isLastChunk
    });

    yield {
      chunk,
      chunkNumber,
      isLastChunk,
      totalChunks
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
  console.log(`Uploading chunk ${chunkNumber}/${totalChunks}`, {
    chunkSize: chunk.size,
    isLastChunk,
    fileName
  });

  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkNumber', chunkNumber.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('isLastChunk', isLastChunk.toString());
  formData.append('fileName', fileName);

  try {
    const response = await fetch('/api/upload-chunk', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Chunk upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(
        errorData.error || 
        errorData.details || 
        `Failed to upload chunk ${chunkNumber} (HTTP ${response.status})`
      );
    }

    const result = await response.json();
    console.log(`Chunk ${chunkNumber} upload result:`, result);
    return result;
  } catch (error) {
    console.error('Error uploading chunk:', {
      chunkNumber,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
} 
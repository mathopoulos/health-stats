import {
  validateFileForChunking,
  calculateOptimalChunkSize,
  createFileChunks,
  DEFAULT_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  MAX_CHUNK_SIZE
} from '../../../health-data/utils/fileChunker';

describe('File Chunker Utilities', () => {
  describe('validateFileForChunking', () => {
    it('should validate valid files correctly', () => {
      const validFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = validateFileForChunking(validFile);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null files', () => {
      // @ts-expect-error Testing null input
      const result = validateFileForChunking(null);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('should reject empty files', () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      const result = validateFileForChunking(emptyFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('should reject files that are too large', () => {
      // Create a large file without using repeat to avoid memory issues
      const largeContent = new Uint8Array(600 * 1024 * 1024); // 600MB
      const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const result = validateFileForChunking(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size exceeds maximum allowed size of 500MB');
    });

    it('should accept files within size limits', () => {
      const validContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const validFile = new File([validContent], 'valid.txt', { type: 'text/plain' });
      const result = validateFileForChunking(validFile);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('calculateOptimalChunkSize', () => {
    it('should use smaller chunks for small files', () => {
      const smallFileSize = 5 * 1024 * 1024; // 5MB
      const chunkSize = calculateOptimalChunkSize(smallFileSize);

      expect(chunkSize).toBeGreaterThanOrEqual(MIN_CHUNK_SIZE);
      expect(chunkSize).toBeLessThanOrEqual(DEFAULT_CHUNK_SIZE);
    });

    it('should use default chunks for medium files', () => {
      const mediumFileSize = 50 * 1024 * 1024; // 50MB
      const chunkSize = calculateOptimalChunkSize(mediumFileSize);

      expect(chunkSize).toBe(DEFAULT_CHUNK_SIZE);
    });

    it('should use larger chunks for big files', () => {
      const largeFileSize = 300 * 1024 * 1024; // 300MB
      const chunkSize = calculateOptimalChunkSize(largeFileSize);

      expect(chunkSize).toBeGreaterThan(DEFAULT_CHUNK_SIZE);
      expect(chunkSize).toBeLessThanOrEqual(MAX_CHUNK_SIZE);
    });

    it('should enforce minimum chunk size', () => {
      const tinyFileSize = 100 * 1024; // 100KB
      const chunkSize = calculateOptimalChunkSize(tinyFileSize);

      expect(chunkSize).toBeGreaterThanOrEqual(MIN_CHUNK_SIZE);
    });

    it('should enforce maximum chunk size', () => {
      const hugeFileSize = 1000 * 1024 * 1024; // 1000MB
      const chunkSize = calculateOptimalChunkSize(hugeFileSize);

      expect(chunkSize).toBeLessThanOrEqual(MAX_CHUNK_SIZE);
    });
  });

  describe('createFileChunks', () => {
    it('should create chunks for valid files', async () => {
      const fileContent = 'x'.repeat(1024 * 1024); // 1MB
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const result = await createFileChunks(file);

      expect(result.chunks).toBeDefined();
      expect(result.totalSize).toBe(file.size);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.averageChunkSize).toBeGreaterThan(0);
    });

    it('should create correct number of chunks', async () => {
      const chunkSize = 256 * 1024; // 256KB
      const fileContent = 'x'.repeat(1024 * 1024); // 1MB
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const result = await createFileChunks(file, { chunkSize });

      expect(result.totalChunks).toBe(Math.ceil(file.size / chunkSize));
      expect(result.chunks.length).toBe(result.totalChunks);
    });

    it('should validate files before chunking', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });

      await expect(createFileChunks(emptyFile)).rejects.toThrow('File is empty');
    });

    it('should create chunks with correct metadata', async () => {
      const fileContent = 'x'.repeat(1024 * 1024); // 1MB
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const result = await createFileChunks(file);

      result.chunks.forEach((chunk, index) => {
        expect(chunk.chunkNumber).toBe(index);
        expect(chunk.size).toBeGreaterThan(0);
        expect(chunk.offset).toBe(index * result.averageChunkSize);
        expect(chunk.totalChunks).toBe(result.totalChunks);
      });

      // Last chunk should be marked correctly
      const lastChunk = result.chunks[result.chunks.length - 1];
      expect(lastChunk.isLastChunk).toBe(true);
    });

    it('should handle custom chunk sizes', async () => {
      const customChunkSize = 512 * 1024; // 512KB
      const fileContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const result = await createFileChunks(file, { chunkSize: customChunkSize });

      expect(result.totalChunks).toBe(4); // 2MB / 512KB = 4 chunks
      expect(result.averageChunkSize).toBe(customChunkSize);
    });

    it('should handle files smaller than chunk size', async () => {
      const fileContent = new Uint8Array(100 * 1024); // 100KB
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const result = await createFileChunks(file);

      // With the current chunk size calculation, small files may still be split
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.chunks[0].size).toBeGreaterThan(0);
      expect(result.chunks[result.chunks.length - 1].isLastChunk).toBe(true);
    });

    it('should provide accurate progress information', async () => {
      const fileContent = 'x'.repeat(1024 * 1024); // 1MB
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const result = await createFileChunks(file);

      let totalSize = 0;
      result.chunks.forEach(chunk => {
        totalSize += chunk.size;
      });

      expect(totalSize).toBe(file.size);
    });
  });

  describe('Chunk constants', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_CHUNK_SIZE).toBe(1 * 1024 * 1024); // 1MB
      expect(MIN_CHUNK_SIZE).toBe(64 * 1024); // 64KB
      expect(MAX_CHUNK_SIZE).toBe(10 * 1024 * 1024); // 10MB
    });

    it('should have logical size relationships', () => {
      expect(MIN_CHUNK_SIZE).toBeLessThan(DEFAULT_CHUNK_SIZE);
      expect(DEFAULT_CHUNK_SIZE).toBeLessThan(MAX_CHUNK_SIZE);
    });
  });
});

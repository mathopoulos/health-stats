// Keep track of processing status
let processingComplete = false;

export function setProcessingComplete(complete: boolean) {
  processingComplete = complete;
}

export function getProcessingStatus(): boolean {
  return processingComplete;
} 
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check if the date is invalid
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getOptimizedImageUrl(url: string, width: number) {
  return `${url}?width=${width}&quality=75&format=webp`
} 
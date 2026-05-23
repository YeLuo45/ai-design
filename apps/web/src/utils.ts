export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  delay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok || response.status >= 400) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (e) {
      lastError = e as Error;
      
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
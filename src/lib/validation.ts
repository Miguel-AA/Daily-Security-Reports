/**
 * Validate and sanitize integer input
 * Returns null if invalid, otherwise returns the integer value
 */
export function validateInteger(value: string | number): number | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (isNaN(num)) {
    return null;
  }
  
  return num;
}

/**
 * Validate non-negative integer
 */
export function validateNonNegativeInteger(value: string | number): {
  valid: boolean;
  value: number | null;
  error?: string;
} {
  const num = validateInteger(value);
  
  if (num === null) {
    return { valid: false, value: null, error: 'Must be a valid number' };
  }
  
  if (num < 0) {
    return { valid: false, value: null, error: 'Cannot be negative' };
  }
  
  if (!Number.isInteger(num)) {
    return { valid: false, value: null, error: 'Must be a whole number' };
  }
  
  return { valid: true, value: num };
}

/**
 * Sanitize number input (remove non-numeric characters except minus at start)
 */
export function sanitizeNumberInput(value: string): string {
  // Remove all non-digit characters
  return value.replace(/[^0-9]/g, '');
}

/**
 * Debounce function for autosave
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

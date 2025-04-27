import { QueryClient } from "@tanstack/react-query";

// Create a client with default query function and better caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // Data remains fresh for 1 minute
      cacheTime: 5 * 60 * 1000, // Cache persists for 5 minutes
      queryFn: async ({ queryKey }) => {
        let url: string;
        if (Array.isArray(queryKey)) {
          // Handle dynamic routes by reconstructing the URL from array segments
          if (queryKey.length > 1) {
            // If queryKey has multiple segments, reconstruct the path
            url = queryKey.join('/').replace(/\/+/g, '/');
          } else {
            // Otherwise just use the first segment
            url = queryKey[0] as string;
          }
        } else {
          url = queryKey as string;
        }
        
        try {
          const response = await fetch(url, {
            credentials: "include", 
            headers: { "X-Requested-With": "XMLHttpRequest" }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("UNAUTHORIZED");
            }
            
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || response.statusText || "An error occurred");
            } else {
              throw new Error(response.statusText || "Server error");
            }
          }
          
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          }
          throw new Error("Invalid response format");
        } catch (error) {
          // Swallow errors from logging to prevent double logs
          if (error instanceof Error && error.message !== "UNAUTHORIZED") {
            console.error(`Query error for ${url}:`, error);
          }
          throw error;
        }
      },
    },
  },
});

// Global declaration to allow access in components that need to manually invalidate
declare global {
  interface Window {
    queryClient: QueryClient;
  }
}

// Make queryClient available globally for debugging and component access
if (typeof window !== "undefined") {
  window.queryClient = queryClient;
}

// Cache-focused version of fetch that uses AbortController for timeouts
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }) {
  const { timeout = 8000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Reusable utility to make API requests
export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options: { timeout?: number } = {}
): Promise<Response> {
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
  };

  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetchWithTimeout(url, {
      ...fetchOptions,
      timeout: options.timeout || 8000 // Default 8 second timeout
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText || "An error occurred";
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Request timeout - the server took too long to respond");
    }
    throw error;
  }
}

// Helper function to create query functions
export function getQueryFn({ on401 = "throw", staleTime, cacheTime }: { 
  on401?: "throw" | "returnNull",
  staleTime?: number,
  cacheTime?: number
} = {}) {
  return async ({ queryKey }: { queryKey: any }) => {
    let url: string;
    if (Array.isArray(queryKey)) {
      // Handle dynamic routes by reconstructing the URL from array segments
      if (queryKey.length > 1) {
        // If queryKey has multiple segments, reconstruct the path
        url = queryKey.join('/').replace(/\/+/g, '/');
      } else {
        // Otherwise just use the first segment
        url = queryKey[0] as string;
      }
    } else {
      url = queryKey as string;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        if (on401 === "returnNull") {
          return null;
        }
        throw new Error("UNAUTHORIZED");
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText || "An error occurred");
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Request timeout - the server took too long to respond");
        }
        if (error.message !== "UNAUTHORIZED") {
          console.error(`Query error for ${url}:`, error);
        }
      }
      throw error;
    }
  };
}
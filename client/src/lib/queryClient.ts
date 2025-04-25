import { QueryClient } from "@tanstack/react-query";

// Create a client with default query function
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const [url] = Array.isArray(queryKey) ? queryKey : [queryKey];
        
        const response = await fetch(url, {
          credentials: "include", 
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || response.statusText || "An error occurred");
        }
        
        return response.json();
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

// Reusable utility to make API requests
export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || response.statusText || "An error occurred";
    throw new Error(errorMessage);
  }
  
  return response;
}

// Helper function to create query functions
export function getQueryFn({ on401 = "throw" }: { on401?: "throw" | "returnNull" } = {}) {
  return async ({ queryKey }: { queryKey: any }) => {
    const [url] = queryKey;
    
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      
      if (response.status === 401) {
        if (on401 === "returnNull") {
          return null;
        }
        throw new Error("Unauthorized");
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText || "An error occurred");
      }
      
      return response.json();
    } catch (error) {
      console.error(`Query error for ${url}:`, error);
      throw error;
    }
  };
}
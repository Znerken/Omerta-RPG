import { QueryClient } from "@tanstack/react-query";

// Create a client with default query function
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
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
        
        // Get the Supabase access token if available
        let supabaseToken = '';
        try {
          // Try to get the token from the global Supabase client if available
          if (window.__SUPABASE_CLIENT) {
            const { data: { session } } = await window.__SUPABASE_CLIENT.auth.getSession();
            supabaseToken = session?.access_token || '';
          }
        } catch (e) {
          console.error("Error getting Supabase token for default query:", e);
        }
        
        const response = await fetch(url, {
          credentials: "include", 
          headers: { 
            "X-Requested-With": "XMLHttpRequest",
            ...(supabaseToken && { "Authorization": `Bearer ${supabaseToken}` })
          }
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
  // Get the Supabase access token if available
  let supabaseToken = '';
  try {
    // Try to get the token from the global Supabase client if available
    if (window.__SUPABASE_CLIENT) {
      const { data: { session } } = await window.__SUPABASE_CLIENT.auth.getSession();
      supabaseToken = session?.access_token || '';
      
      console.log(`API Request to ${url} - Auth token available: ${!!supabaseToken}`);
    } else {
      console.warn(`API Request to ${url} - No Supabase client available`);
    }
  } catch (e) {
    console.error("Error getting Supabase token:", e);
  }
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(supabaseToken && { "Authorization": `Bearer ${supabaseToken}` }),
    },
    credentials: "include",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`API Error ${response.status} for ${url}:`, await response.text());
      const errorData = await response.json().catch(() => ({ message: response.statusText || "An error occurred" }));
      throw new Error(errorData.message || response.statusText || "An error occurred");
    }
    
    return response;
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error);
    throw error;
  }
}

// Helper function to create query functions
export function getQueryFn({ on401 = "throw" }: { on401?: "throw" | "returnNull" } = {}) {
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
    
    // Get the Supabase access token if available
    let supabaseToken = '';
    try {
      // Try to get the token from the global Supabase client if available
      if (window.__SUPABASE_CLIENT) {
        const { data: { session } } = await window.__SUPABASE_CLIENT.auth.getSession();
        supabaseToken = session?.access_token || '';
        
        if (supabaseToken && url.includes('/api/')) {
          console.log(`Query for ${url} - Auth token available: ${!!supabaseToken}`);
        }
      }
    } catch (e) {
      console.error("Error getting Supabase token for query:", e);
    }
    
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          ...(supabaseToken && { "Authorization": `Bearer ${supabaseToken}` }),
        },
      });
      
      if (response.status === 401) {
        console.warn(`Unauthorized access to ${url}`);
        if (on401 === "returnNull") {
          return null;
        }
        throw new Error("Unauthorized");
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Query error for ${url}:`, response.status, errorText);
        
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || response.statusText || "An error occurred");
      }
      
      return response.json();
    } catch (error) {
      console.error(`Query error for ${url}:`, error);
      throw error;
    }
  };
}
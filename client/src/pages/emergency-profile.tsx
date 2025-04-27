import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EmergencyProfilePage() {
  const params = useParams<{ id: string }>();
  console.log("EmergencyProfilePage - params:", params);
  
  const userId = params?.id ? parseInt(params.id) : null;
  console.log("EmergencyProfilePage - userId:", userId);
  
  // Local state to store raw data for inspection
  const [rawUserData, setRawUserData] = useState<string | null>(null);
  
  // Fetch user data using our emergency endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/debug/user', userId],
    queryFn: async () => {
      console.log(`Emergency profile request for user ID ${userId}`);
      
      try {
        const res = await fetch(`/api/debug/user/${userId}`);
        console.log("Response status:", res.status);
        console.log("Response type:", res.headers.get('content-type'));
        
        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error("Non-JSON response:", text.substring(0, 500));
          throw new Error("Received non-JSON response");
        }
        
        const jsonData = await res.json();
        console.log("Raw profile data:", jsonData);
        
        // Store the raw data for display
        setRawUserData(JSON.stringify(jsonData, null, 2));
        
        return jsonData;
      } catch (err) {
        console.error("Fetch error:", err);
        throw err;
      }
    },
    enabled: !!userId && !isNaN(userId),
    retry: 2
  });
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-blue-500 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-700">Error Loading Profile</h2>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <pre className="bg-red-100 p-4 rounded text-left text-sm overflow-auto max-h-48">
            {error instanceof Error && error.stack ? error.stack : "No stack trace available"}
          </pre>
        </div>
      </div>
    );
  }
  
  // If the data is not properly structured
  if (!data || !data.success || !data.user) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-blue-500 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Profile Data Issue</h2>
          <p className="text-yellow-800 mb-4">The profile data returned by the server is not in the expected format.</p>
          
          <h3 className="font-semibold mb-2 text-yellow-700">Raw Response:</h3>
          <pre className="bg-yellow-100 p-4 rounded text-sm overflow-auto max-h-96 text-left">
            {rawUserData || JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
  
  // Extract user data
  const user = data.user;
  
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-500 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 px-2 py-1 rounded-md font-medium">
            EMERGENCY MODE
          </span>
          <Link href={`/player/${user.id}`} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
            Try Normal View
          </Link>
        </div>
      </div>
      
      {/* Basic profile card with noir theme styling */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg shadow-lg mb-6 overflow-hidden">
        {/* Banner section */}
        <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-900 relative">
          {/* Animated film grain overlay */}
          <div className="absolute inset-0 bg-black/20 film-grain opacity-30"></div>
          
          {/* Banner decorative elements */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
          <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent"></div>
          <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent"></div>
        </div>
        
        <div className="p-6 relative">
          {/* Avatar positioned to overlap banner */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-800 shadow-lg flex items-center justify-center text-3xl font-bold overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-amber-500">{user.username ? user.username.charAt(0).toUpperCase() : "?"}</span>
              )}
            </div>
          </div>
          
          {/* User identity */}
          <div className="text-center mt-12 mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">{user.username}</h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-amber-500">ID: {user.id}</span>
              <span className="text-gray-400">•</span>
              <span className="text-amber-500">Level {user.level || 1}</span>
              <span className="text-gray-400">•</span>
              <span className={user.is_admin ? "text-red-400" : "text-gray-400"}>
                {user.is_admin ? "Admin" : "Member"}
              </span>
            </div>
          </div>
          
          {/* User stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-md border border-gray-700 p-4">
              <div className="text-sm text-gray-400 mb-1">Cash</div>
              <div className="text-xl font-semibold text-amber-500">${user.cash?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-gray-800/50 rounded-md border border-gray-700 p-4">
              <div className="text-sm text-gray-400 mb-1">Respect</div>
              <div className="text-xl font-semibold text-amber-500">{user.respect || 0}</div>
            </div>
          </div>
          
          {user.bio && (
            <div className="mb-6 bg-gray-800/50 rounded-md border border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-2">Bio</h2>
              <p className="text-gray-300">{user.bio}</p>
            </div>
          )}
          
          {/* User details */}
          <div className="bg-gray-800/50 rounded-md border border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-white mb-3">Account Details</h2>
            <ul className="space-y-3">
              <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-gray-400">Status</span>
                <span className={user.is_jailed ? "text-red-400" : "text-green-400"}>
                  {user.is_jailed ? "In Jail" : "Free"}
                </span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-gray-400">Gang</span>
                <span className="text-white">{user.gang_id ? `ID: ${user.gang_id}` : "None"}</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-gray-400">Online Status</span>
                <span className={user.status === 'online' ? "text-green-400" : "text-gray-400"}>
                  {user.status || "Offline"}
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-400">Last Seen</span>
                <span className="text-white">{user.last_seen ? new Date(user.last_seen).toLocaleString() : "Unknown"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Raw data section for debugging with improved styling */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white">
            <span className="text-amber-500 mr-2">{"{"}</span>
            Raw JSON Data
            <span className="text-amber-500 ml-2">{"}"}</span>
          </h2>
          <button 
            className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 rounded-md transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(rawUserData || JSON.stringify(data, null, 2));
              toast({
                title: "Copied to clipboard",
                description: "The raw JSON data has been copied to your clipboard.",
                status: "success",
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy JSON
          </button>
        </div>
        <pre className="text-xs overflow-auto max-h-96 bg-gray-950 p-4 rounded-md border border-gray-800 text-amber-300 font-mono">
          {rawUserData || JSON.stringify(data, null, 2)}
        </pre>
      </div>
      
      {/* Database field reference */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Database Field Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {user && Object.entries(user).map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 bg-gray-800/50 rounded p-2 border border-gray-700">
              <span className="text-amber-500 font-mono text-xs whitespace-nowrap">{key}:</span>
              <span className="text-gray-300 text-xs break-all">
                {value === null ? (
                  <span className="text-gray-500">null</span>
                ) : typeof value === 'object' ? (
                  JSON.stringify(value)
                ) : (
                  String(value)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
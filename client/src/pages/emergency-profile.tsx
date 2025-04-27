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
      <div className="mb-6">
        <Link href="/" className="flex items-center text-blue-500 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      {/* Basic profile card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold">
              {user.username ? user.username.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {user.id} • Level {user.level || 1}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">Cash</div>
              <div className="text-lg font-semibold">${user.cash?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">Respect</div>
              <div className="text-lg font-semibold">{user.respect || 0}</div>
            </div>
          </div>
          
          {user.bio && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-1">Bio</h2>
              <p className="text-gray-600 dark:text-gray-300">{user.bio}</p>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h2 className="text-lg font-semibold mb-3">Account Details</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={user.is_jailed ? "text-red-500" : ""}>
                  {user.is_jailed ? "In Jail" : "Free"}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Gang</span>
                <span>{user.gang_id ? `ID: ${user.gang_id}` : "None"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Online Status</span>
                <span className={user.status === 'online' ? "text-green-500" : "text-gray-500"}>
                  {user.status || "Offline"}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last Seen</span>
                <span>{user.last_seen ? new Date(user.last_seen).toLocaleString() : "Unknown"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Raw data section for debugging */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Raw JSON Data</h2>
          <button 
            className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
            onClick={() => navigator.clipboard.writeText(rawUserData || JSON.stringify(data, null, 2))}
          >
            Copy to Clipboard
          </button>
        </div>
        <pre className="text-xs overflow-auto max-h-96 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
          {rawUserData || JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
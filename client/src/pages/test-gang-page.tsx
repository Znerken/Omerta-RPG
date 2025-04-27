import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function TestGangPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const createGangMutation = useMutation({
    mutationFn: async (gangData: { name: string; tag: string; description: string }) => {
      const response = await fetch("/api/gangs-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gangData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create gang");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      setError(null);
      toast({
        title: "Gang Created!",
        description: `Your gang "${data.name}" has been successfully created.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
    },
    onError: (error: Error) => {
      setSuccess(false);
      setError(error.message);
      toast({
        title: "Error Creating Gang",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate
    if (!name || name.length < 3) {
      setError("Gang name must be at least 3 characters");
      return;
    }
    
    if (!tag || tag.length < 2) {
      setError("Gang tag must be at least 2 characters");
      return;
    }
    
    // Submit
    createGangMutation.mutate({ name, tag, description });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You must be logged in to access this page.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardTitle className="text-2xl">Test Gang Creation</CardTitle>
          <CardDescription className="text-gray-300">
            This is a test form to diagnose gang creation issues.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-100 border-green-500">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your gang was created successfully.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Gang Name</Label>
              <Input
                id="name"
                placeholder="Enter gang name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Must be at least 3 characters.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag">Gang Tag</Label>
              <Input
                id="tag"
                placeholder="Enter gang tag (2-5 characters)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                maxLength={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                A short (2-5 characters) tag for your gang.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter gang description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                Optional - describe your gang's purpose and activities.
              </p>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createGangMutation.isPending}
          >
            {createGangMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating...
              </>
            ) : "Create Gang"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
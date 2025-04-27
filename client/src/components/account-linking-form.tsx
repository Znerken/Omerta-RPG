import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LinkIcon, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AccountLinkingForm() {
  const { supabaseUser, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if already linked
  async function checkIfAlreadyLinked() {
    if (!supabaseUser) return false;
    
    try {
      const response = await apiRequest('GET', `/api/debug/check-supabase-id/${supabaseUser.id}`);
      const data = await response.json();
      return data.linked;
    } catch (error) {
      console.error('Error checking link status:', error);
      return false;
    }
  }

  // Function to link accounts
  async function linkAccounts(e: React.FormEvent) {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing information",
        description: "Please provide both your game username and password",
        variant: "destructive",
      });
      return;
    }
    
    if (!supabaseUser) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in with Supabase to link accounts",
        variant: "destructive",
      });
      return;
    }
    
    setIsLinking(true);
    
    try {
      const response = await apiRequest('POST', '/api/link-supabase-user', {
        username,
        password,
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Accounts linked!",
          description: `Successfully linked to game account: ${data.user.username}`,
        });
        
        setSuccess(true);
        
        // Wait a moment then force reload to update auth state
        setTimeout(() => {
          window.location.href = `/?reload=${Date.now()}`;
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Linking failed",
          description: errorData.message || "Failed to link accounts. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error linking accounts:', error);
      toast({
        title: "Linking error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  }

  // If already linked, show a success message
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
            Accounts Linked
          </CardTitle>
          <CardDescription>
            Your Supabase and game accounts are now connected!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            You will be redirected to the dashboard momentarily...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <LinkIcon className="mr-2 h-5 w-5" />
          Link Your Account
        </CardTitle>
        <CardDescription>
          Connect your Supabase login to your existing game account
        </CardDescription>
      </CardHeader>
      <form onSubmit={linkAccounts}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Game Username</Label>
            <Input 
              id="username" 
              placeholder="Enter your existing game username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLinking}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Game Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Enter your game password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLinking}
              required
            />
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p>This will permanently link your Supabase login to your existing game account.</p>
                <p className="mt-1">In the future, you'll be able to login directly with your email.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={signOut} 
            disabled={isLinking} 
            type="button"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLinking}
          >
            {isLinking ? 'Linking...' : 'Link Accounts'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
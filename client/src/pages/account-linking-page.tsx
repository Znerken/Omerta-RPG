import { AccountLinkingForm } from '@/components/account-linking-form';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export default function AccountLinkingPage() {
  const { supabaseUser, isLoading } = useSupabaseAuth();

  // Show loading while authenticating
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking authentication status...</p>
      </div>
    );
  }

  // Redirect if not logged in with Supabase
  if (!supabaseUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-6 text-muted-foreground">
          You need to be logged in to link your accounts.
        </p>
        <Link href="/auth">
          <a className="text-primary hover:underline">Go to Login</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 container max-w-screen-lg mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Account Linking
          </h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Link your Supabase login with your existing game account
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
          <div>
            <AccountLinkingForm />
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function SupabaseAuthPage() {
  // Auth state
  const { user, isLoading, signIn, signUp } = useSupabaseAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const { toast } = useToast();

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Already logged in - redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validate form
      if (!loginForm.email || !loginForm.password) {
        toast({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }

      // Sign in
      await signIn(loginForm);

      toast({
        title: 'Welcome back',
        description: 'You have been successfully logged in',
      });
    } catch (error) {
      // Handle error
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validate form
      if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }

      // Check if passwords match
      if (registerForm.password !== registerForm.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return;
      }

      // Check password length
      if (registerForm.password.length < 6) {
        toast({
          title: 'Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        });
        return;
      }

      // Check username length
      if (registerForm.username.length < 3) {
        toast({
          title: 'Error',
          description: 'Username must be at least 3 characters long',
          variant: 'destructive',
        });
        return;
      }

      // Sign up
      await signUp(registerForm.email, registerForm.password, {
        username: registerForm.username,
        email: registerForm.email,
      });

      toast({
        title: 'Welcome to OMERTÀ',
        description: 'Your account has been created successfully',
      });
    } catch (error) {
      // Handle error
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Authentication form */}
      <div className="w-full md:w-1/2 p-4 md:p-10 flex items-center justify-center bg-black">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 mb-2">
              OMERTÀ
            </h1>
            <p className="text-sm text-gray-400">THE CODE OF SILENCE</p>
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="backdrop-blur-md bg-black/50 border-gray-800">
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                      disabled={formLoading}
                    >
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sign In
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="backdrop-blur-md bg-black/50 border-gray-800">
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Join the family and become part of OMERTÀ</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Choose a unique username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                      disabled={formLoading}
                    >
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sign Up
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="w-full md:w-1/2 hidden md:flex bg-[url('/attached_assets/gen-mafia-study-luxury-dark-wood-leather-mahogany-desk.webp')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center p-10">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">Welcome to the Underworld</h2>
            <p className="text-lg mb-8 text-gray-300">
              Step into the shadows of OMERTÀ, where loyalty is everything and ambition knows no bounds. Build your criminal empire, forge alliances, and rise through the ranks of the most feared organization.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center mr-4 mt-1">
                  <span className="text-red-500">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Criminal Operations</h3>
                  <p className="text-gray-400">Execute heists, run protection rackets, and expand your territory across the city.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center mr-4 mt-1">
                  <span className="text-red-500">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Gang Warfare</h3>
                  <p className="text-gray-400">Form powerful crews, declare war on rivals, and battle for control of lucrative territories.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center mr-4 mt-1">
                  <span className="text-red-500">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Black Market Empire</h3>
                  <p className="text-gray-400">Master the underground economy through drug trafficking, weapon dealing, and money laundering.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for loading state */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-red-500" />
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Register form schema
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SupabaseAuthPage() {
  const { user, signIn, signUp, isLoading } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // If user is already logged in, redirect to home page
  if (user) {
    setLocation('/');
    return null;
  }

  // Handle login form submission
  const handleLogin = async (values: LoginFormValues) => {
    try {
      await signIn(values);
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to OMERTÀ!',
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };

  // Handle register form submission
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await signUp(values.email, values.password, {
        username: values.username,
        email: values.email,
      });
      
      toast({
        title: 'Registration successful',
        description: 'Welcome to OMERTÀ!',
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black">
      {/* Hero section */}
      <div className="w-full md:w-1/2 bg-black flex flex-col justify-center items-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/29/1d/70/291d7007c84a0ae18c950f3d1621e4af.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black"></div>
        
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
            OMERTÀ
          </h1>
          <p className="text-lg text-gray-300 mb-8 italic">
            "The code of silence"
          </p>
          <div className="prose prose-invert max-w-none">
            <p className="text-xl mb-6">
              Welcome to the criminal underworld, where power, respect, and wealth are yours for the taking.
            </p>
            <p className="mb-4">
              Build your criminal empire, form alliances, eliminate rivals, and rise through the ranks to become 
              the most feared and respected mafia boss in the city.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-black/50 border border-red-800/50 p-4 rounded-lg">
                <h3 className="text-red-500 text-lg font-bold">Criminal Activities</h3>
                <p className="text-sm">Master crimes from petty theft to major heists</p>
              </div>
              <div className="bg-black/50 border border-amber-800/50 p-4 rounded-lg">
                <h3 className="text-amber-500 text-lg font-bold">Gang Warfare</h3>
                <p className="text-sm">Form gangs, control territories, eliminate rivals</p>
              </div>
              <div className="bg-black/50 border border-red-800/50 p-4 rounded-lg">
                <h3 className="text-red-500 text-lg font-bold">Black Market</h3>
                <p className="text-sm">Trade drugs, weapons, and other contraband</p>
              </div>
              <div className="bg-black/50 border border-amber-800/50 p-4 rounded-lg">
                <h3 className="text-amber-500 text-lg font-bold">Underground Casino</h3>
                <p className="text-sm">Gamble your fortune in high-stakes games</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
      </div>

      {/* Form section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-black to-gray-900">
        <div className="w-full max-w-md">
          <Tabs
            defaultValue={activeTab}
            onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Login to OMERTÀ</CardTitle>
                  <CardDescription>Enter your credentials to access your criminal empire</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="your.email@example.com"
                                type="email"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your password"
                                type="password"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          'Login'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-sm text-gray-500 text-center">
                    Don't have an account?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('register')}>
                      Register now
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Join OMERTÀ</CardTitle>
                  <CardDescription>Create a new account to start your criminal career</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Choose a username"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be your identity in the criminal underworld
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="your.email@example.com"
                                type="email"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Create a password"
                                type="password"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Confirm your password"
                                type="password"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-sm text-gray-500 text-center">
                    Already have an account?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('login')}>
                      Login
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
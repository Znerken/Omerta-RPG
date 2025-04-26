import { useState } from 'react';
import { useNavigate, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

// Form schemas for validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function SupabaseAuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, isLoading } = useSupabaseAuth();
  
  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  // Login form setup
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  // Handle registration submission
  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, { 
        username: data.username
      });
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created. You can now log in.',
      });
      
      // Switch to login tab after successful registration
      setActiveTab('login');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Auth Form Section */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-gray-800 bg-black/40 backdrop-blur-md">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-600">
                OMERTÀ
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                Enter the world of organized crime
              </CardDescription>
            </CardHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-gray-900/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <CardContent className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="you@example.com" 
                                {...field} 
                                className="bg-gray-900 border-gray-800"
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
                                type="password" 
                                placeholder="••••••••" 
                                {...field}
                                className="bg-gray-900 border-gray-800"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-amber-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sign In
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register" className="space-y-4 mt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <CardContent className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="kingpin" 
                                {...field}
                                className="bg-gray-900 border-gray-800"
                              />
                            </FormControl>
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
                                placeholder="you@example.com" 
                                {...field}
                                className="bg-gray-900 border-gray-800"
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
                                type="password" 
                                placeholder="••••••••" 
                                {...field}
                                className="bg-gray-900 border-gray-800"
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
                                type="password" 
                                placeholder="••••••••" 
                                {...field}
                                className="bg-gray-900 border-gray-800"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-amber-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Create Account
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center lg:text-left lg:items-start">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-amber-600">
              The Code of Silence
            </h1>
            
            <p className="text-gray-400 max-w-md mx-auto lg:mx-0">
              Build your criminal empire, form powerful alliances, and rise through the ranks of the mafia underworld.
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
                <h3 className="font-bold text-amber-500 mb-1">Crime Operations</h3>
                <p className="text-sm text-gray-400">Run illicit operations and expand your territory in the criminal underworld.</p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
                <h3 className="font-bold text-amber-500 mb-1">Gang Warfare</h3>
                <p className="text-sm text-gray-400">Form alliances, declare war, and fight for control of the city.</p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
                <h3 className="font-bold text-amber-500 mb-1">Black Market</h3>
                <p className="text-sm text-gray-400">Trade contraband and illegal goods in the underworld economy.</p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
                <h3 className="font-bold text-amber-500 mb-1">Rise in Power</h3>
                <p className="text-sm text-gray-400">Climb the ranks from street soldier to feared mafia boss.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
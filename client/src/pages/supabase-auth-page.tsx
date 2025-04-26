import { useState } from 'react';
import { Redirect } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Lock, Mail, User } from 'lucide-react';

// Define schemas for form validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SupabaseAuthPage() {
  const { user, signIn, signUp, isLoading } = useSupabaseAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Define forms using react-hook-form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await signIn(values.email, values.password);
      // Redirect is handled by the auth hook
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      await signUp(values.email, values.password, values.username, values.confirmPassword);
      // Redirect is handled by the auth hook
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Redirect to homepage if user is already authenticated
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Left Column: Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-[#151515] border-[#333] text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center text-red-600">
              OMERTÀ
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              The code of silence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="login" 
              value={authMode} 
              onValueChange={(value) => setAuthMode(value as 'login' | 'register')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="your@email.com" 
                                className="pl-10 bg-[#252525] border-[#333]" 
                                {...field} 
                              />
                            </div>
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
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="********" 
                                type="password" 
                                className="pl-10 bg-[#252525] border-[#333]" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-red-700 hover:bg-red-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="Your gangster name" 
                                className="pl-10 bg-[#252525] border-[#333]" 
                                {...field} 
                              />
                            </div>
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
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="your@email.com" 
                                className="pl-10 bg-[#252525] border-[#333]" 
                                {...field} 
                              />
                            </div>
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
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="********" 
                                type="password" 
                                className="pl-10 bg-[#252525] border-[#333]" 
                                {...field} 
                              />
                            </div>
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
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="********" 
                                type="password" 
                                className="pl-10 bg-[#252525] border-[#333]" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-red-700 hover:bg-red-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t border-[#333] flex justify-center pt-4">
            <p className="text-xs text-gray-400 text-center">
              By signing in or creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column: Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-[url('/assets/gen-mafia-study-luxury-dark-wood-leather-mahogany-desk.webp')] bg-cover bg-center relative flex-col justify-center items-center p-10">
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-4 tracking-tight">OMERTÀ</h1>
          <p className="text-xl text-white mb-6">The underground awaits your command.</p>
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="bg-red-700 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Build your criminal empire from the ground up</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-red-700 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Engage in gang warfare and strategic territory control</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-red-700 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Master the underground economy through crime and business</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
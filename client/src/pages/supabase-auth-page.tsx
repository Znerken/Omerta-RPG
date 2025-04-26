import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Redirect } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import noiseOverlayURL from '@assets/noise-50.png';

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

// Registration form schema
const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username cannot be longer than 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SupabaseAuthPage() {
  const { user, gameUser, isLoading, signIn, signUp } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Reset forms when switching tabs
  useEffect(() => {
    if (activeTab === 'login') {
      loginForm.reset();
    } else {
      registerForm.reset();
    }
  }, [activeTab, loginForm, registerForm]);

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle registration form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await signUp(values.email, values.password, values.username, values.confirmPassword);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if user is already authenticated and has game user data
  if (user && gameUser) {
    return <Redirect to="/" />;
  }

  // Redirect to complete profile if user is authenticated but no game user
  if (user && !gameUser && !isLoading) {
    return <Redirect to="/complete-profile" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Noise overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 z-10" 
        style={{ backgroundImage: `url(${noiseOverlayURL})` }}
      />
      
      {/* Main content */}
      <div className="container flex-1 flex py-12 z-20">
        <div className="grid w-full lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Auth form column */}
          <Card className="w-full max-w-md mx-auto bg-black/50 border-red-900/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold text-red-600 tracking-wider">OMERTÀ</CardTitle>
              <CardDescription className="text-gray-400">THE CODE OF SILENCE</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
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
                              <Input placeholder="your@email.com" {...field} className="bg-black/50" />
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
                              <Input type="password" placeholder="••••••••" {...field} className="bg-black/50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Sign In
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Registration Form */}
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
                              <Input placeholder="Enter your alias" {...field} className="bg-black/50" />
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
                              <Input placeholder="your@email.com" {...field} className="bg-black/50" />
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
                              <Input type="password" placeholder="••••••••" {...field} className="bg-black/50" />
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
                              <Input type="password" placeholder="••••••••" {...field} className="bg-black/50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Register
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="text-xs text-center text-gray-500 flex flex-col">
              <p>By signing up, you agree to the Terms of Service and Privacy Policy.</p>
            </CardFooter>
          </Card>
          
          {/* Hero content column */}
          <div className="hidden lg:flex flex-col space-y-6">
            <div className="space-y-4 text-center lg:text-left">
              <h1 className="text-5xl font-bold text-red-600 tracking-wider">OMERTÀ</h1>
              <p className="text-xl text-gray-300">The underground awaits your command</p>
              <p className="text-gray-400 max-w-md">
                Build your criminal empire, recruit your crew, and rise through the ranks of the underworld.
                Take on high-stakes missions, engage in turf wars, and establish your dominance in the shadows.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-5 border border-red-900/20">
                <h3 className="text-lg font-bold mb-2">Criminal Operations</h3>
                <p className="text-sm text-gray-400">Run rackets, smuggle contraband, and expand your territory across the city.</p>
              </div>
              <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-5 border border-red-900/20">
                <h3 className="text-lg font-bold mb-2">Gang Warfare</h3>
                <p className="text-sm text-gray-400">Form alliances, battle rival gangs, and dominate strategic locations.</p>
              </div>
              <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-5 border border-red-900/20">
                <h3 className="text-lg font-bold mb-2">Underground Economy</h3>
                <p className="text-sm text-gray-400">Manage illegal businesses, launder money, and invest in legitimate fronts.</p>
              </div>
              <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-5 border border-red-900/20">
                <h3 className="text-lg font-bold mb-2">Criminal Network</h3>
                <p className="text-sm text-gray-400">Recruit skilled associates, build loyalty, and protect your empire from threats.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
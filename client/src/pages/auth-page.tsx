import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TommyGunIcon, FedoraIcon } from "@/components/ui/mafia-icons";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Must be a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Create test user mutation
  const createTestUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/dev/create-test-user");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create test user");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test User Created",
        description: `Created user: ${data.user.username} with $500,000 cash, level 5, and 20 of each stat`,
      });
      // The backend automatically logs the user in, no need to call loginMutation
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create test user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormData) => {
    const { username, email, password } = data;
    registerMutation.mutate({ username, email, password });
  };
  
  const handleCreateTestUser = () => {
    createTestUserMutation.mutate();
  };
  
  // Redirect to home if logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url('/assets/mafia-background.svg')`,
      }}
    >
      <div className="container flex flex-col md:flex-row w-full max-w-6xl p-4 gap-8">
        {/* Left column: Auth forms */}
        <div className="flex-1 flex flex-col justify-center z-10">
          <Card className="card-mafia backdrop-blur-sm shadow-dramatic p-8 border border-gold/20">
            <div className="mb-8 flex items-center justify-center">
              <FedoraIcon size="lg" color="gold" className="mr-4" />
              <div>
                <h1 className="text-4xl font-heading text-gold-gradient mb-2">Mafia Empire</h1>
                <p className="text-muted-foreground">Enter the criminal underworld.</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your alias" {...field} />
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
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Verifying..." : "Enter the Underworld"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-8 pt-6 border-t border-border/30">
                  <div className="text-center mb-3">
                    <p className="text-xs text-muted-foreground">Development Testing</p>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full bg-black/30 border-gold/30 text-gold hover:bg-black/50"
                    onClick={handleCreateTestUser}
                    disabled={createTestUserMutation.isPending}
                  >
                    {createTestUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Test User...
                      </>
                    ) : "Create Test User"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Creates a random user with $500,000 cash, level 5, and 20 of all stats
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose your alias" {...field} />
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
                            <Input placeholder="your@email.com" {...field} />
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
                            <Input type="password" placeholder="Create a password" {...field} />
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
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating..." : "Join the Family"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-8 pt-6 border-t border-border/30">
                  <div className="text-center mb-3">
                    <p className="text-xs text-muted-foreground">Development Testing</p>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full bg-black/30 border-gold/30 text-gold hover:bg-black/50"
                    onClick={handleCreateTestUser}
                    disabled={createTestUserMutation.isPending}
                  >
                    {createTestUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Test User...
                      </>
                    ) : "Create Test User"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Creates a random user with $500,000 cash, level 5, and 20 of all stats
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Right column: Hero section */}
        <div className="flex-1 hidden md:flex flex-col justify-center z-10 pl-8">
          <div className="backdrop-blur-sm bg-black/30 rounded-sm p-8 h-full shadow-dramatic border-l-4 border-gold/40">
            <div className="h-full flex flex-col justify-center space-y-8">
              <div className="mb-8 flex flex-col items-center md:items-start">
                <img src="/assets/mafia-icon.svg" alt="Mafia Icon" className="w-24 h-24 mb-4" />
                <div className="inline-block mb-3 pb-1 border-b-2 border-gold/40">
                  <h2 className="text-3xl font-heading text-gold-gradient">Rise to Power</h2>
                </div>
                <p className="text-muted-foreground text-base">
                  Welcome to Mafia Empire, where the streets are yours for the taking.
                  Build your criminal empire, form powerful alliances, and leave your mark
                  on the underworld.
                </p>
              </div>
              
              <div className="space-y-6">
                <Feature 
                  title="Commit Crimes" 
                  description="From petty theft to elaborate heists, climb your way up the criminal ladder." 
                  icon={<TommyGunIcon size="md" />} 
                />
                
                <Feature 
                  title="Form a Gang" 
                  description="Recruit loyal members and establish a feared criminal organization." 
                  icon={<FedoraIcon size="md" />} 
                />
                
                <Feature 
                  title="Control Territory" 
                  description="Expand your influence and dominate the city district by district." 
                  icon={<TommyGunIcon size="md" />} 
                />
                
                <Feature 
                  title="Build an Empire" 
                  description="Develop businesses, launder money, and become the ultimate crime boss." 
                  icon={<FedoraIcon size="md" />} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start hover:translate-x-1 transition-transform duration-200">
      <div className="mr-4 p-2 bg-black/60 border border-gold/30 rounded-sm text-gold shadow-gold/20 shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="font-medium mb-1 text-gold/90">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
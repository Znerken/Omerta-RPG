import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TommyGunIcon, FedoraIcon, RevolverIcon, MoneyBriefcaseIcon, WhiskeyGlassIcon } from "@/components/ui/mafia-icons";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import mafiaCharacterImg from "../assets/mafia-character.jpg";

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

// Animation variants for framer-motion
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  out: {
    opacity: 0,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

const formVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const iconVariants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  hover: {
    rotate: 15,
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 10,
    },
  },
  tap: {
    rotate: -15,
    scale: 0.95,
  },
  success: {
    rotate: [0, 10, -10, 0],
    scale: [1, 1.2, 1.2, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.3, 0.6, 1],
    },
  },
};

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showGunshot, setShowGunshot] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [animateIcon, setAnimateIcon] = useState(false);
  
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
  
  // Handle tab changes with animations
  const handleTabChange = (newTab: "login" | "register") => {
    setShowSmoke(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setShowSmoke(false);
    }, 300);
  };
  
  // Trigger animations on form submit
  const onLoginSubmit = (data: LoginFormData) => {
    setShowGunshot(true);
    setAnimateIcon(true);
    
    setTimeout(() => {
      setShowGunshot(false);
      loginMutation.mutate(data);
    }, 600);
    
    setTimeout(() => {
      setAnimateIcon(false);
    }, 1000);
  };
  
  const onRegisterSubmit = (data: RegisterFormData) => {
    setShowSpotlight(true);
    setAnimateIcon(true);
    
    setTimeout(() => {
      setShowSpotlight(false);
      const { username, email, password } = data;
      registerMutation.mutate({ username, email, password });
    }, 600);
    
    setTimeout(() => {
      setAnimateIcon(false);
    }, 1000);
  };
  
  // Trigger spotlight on page load
  useEffect(() => {
    setShowSpotlight(true);
    setTimeout(() => setShowSpotlight(false), 2000);
  }, []);
  
  // Redirect to home if logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Prepare login and register content
  const loginContent = (
    <TabsContent value="login" key="login-tab">
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <FormField
              control={loginForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your alias" 
                      {...field} 
                      className="backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your password" 
                      {...field} 
                      className="backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={3}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              className="w-full relative overflow-hidden"
              disabled={loginMutation.isPending}
            >
              <motion.span className="relative z-10 flex items-center justify-center">
                {loginMutation.isPending ? (
                  <>Verifying... <WhiskeyGlassIcon className="ml-2 animate-spin" size="sm" /></>
                ) : (
                  <>Enter the Underworld <TommyGunIcon className="ml-2" size="sm" /></>
                )}
              </motion.span>
            </Button>
          </motion.div>
        </form>
      </Form>
    </TabsContent>
  );

  const registerContent = (
    <TabsContent value="register" key="register-tab">
      <Form {...registerForm}>
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <FormField
              control={registerForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Choose your alias" 
                      {...field} 
                      className="backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your@email.com" 
                      {...field} 
                      className="backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Create a password" 
                      {...field} 
                      className="backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <FormField
              control={registerForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirm your password" 
                      {...field} 
                      className="backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            custom={5}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              className="w-full relative overflow-hidden"
              disabled={registerMutation.isPending}
            >
              <span className="relative z-10 flex items-center justify-center">
                {registerMutation.isPending ? (
                  <>Creating... <WhiskeyGlassIcon className="ml-2 animate-spin" size="sm" /></>
                ) : (
                  <>Join the Family <FedoraIcon className="ml-2" size="sm" /></>
                )}
              </span>
            </Button>
          </motion.div>
        </form>
      </Form>
    </TabsContent>
  );
  
  return (
    <motion.div 
      className="h-screen w-full flex items-center justify-center relative"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      {/* Special effects overlays */}
      <div className={`spotlight-effect w-full h-full absolute top-0 left-0 ${showSpotlight ? 'active' : ''}`}></div>
      <div className={`gunshot-effect w-full h-full absolute top-0 left-0 ${showGunshot ? 'active' : ''}`}></div>
      
      <div className="container flex flex-col md:flex-row w-full max-w-6xl p-4 gap-8 z-10">
        {/* Left column: Auth forms */}
        <motion.div 
          className="flex-1 flex flex-col justify-center"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className={`card-mafia shadow-dramatic p-8 relative overflow-hidden ${showSmoke ? 'smoke-effect active' : ''}`}>
            <motion.div 
              className="mb-8 flex items-center justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate={animateIcon ? "success" : "initial"}
                whileHover="hover"
                whileTap="tap"
                className="mr-4"
              >
                <FedoraIcon size="lg" color="primary" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-4xl font-heading text-gold-gradient mb-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  Mafia Empire
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground typing-effect"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  Enter the criminal underworld.
                </motion.p>
              </div>
            </motion.div>
            
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => handleTabChange(v as "login" | "register")} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex items-center"
                  >
                    <RevolverIcon size="sm" className="mr-2" /> Login
                  </motion.span>
                </TabsTrigger>
                <TabsTrigger value="register">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="flex items-center"
                  >
                    <MoneyBriefcaseIcon size="sm" className="mr-2" /> Register
                  </motion.span>
                </TabsTrigger>
              </TabsList>
              
              {/* Display content based on active tab */}
              {activeTab === "login" ? loginContent : registerContent}
            </Tabs>
            
            {/* Crime tape border effect that appears on errors */}
            {(loginForm.formState.errors.username || 
              loginForm.formState.errors.password ||
              registerForm.formState.errors.username ||
              registerForm.formState.errors.email ||
              registerForm.formState.errors.password ||
              registerForm.formState.errors.confirmPassword) && (
              <motion.div 
                className="absolute inset-0 pointer-events-none border-crime-scene animate-crime-tape"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            )}
          </Card>
        </motion.div>
        
        {/* Right column: Hero section */}
        <motion.div 
          className="flex-1 hidden md:flex flex-col justify-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className={`backdrop-mafia rounded-sm p-8 h-full shadow-dramatic relative ${showSpotlight ? 'spotlight-effect active' : ''}`}>
            <div className="h-full flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-8 flex-1">
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <motion.h2 
                    className="text-3xl font-heading mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  >
                    Rise to Power
                  </motion.h2>
                  <motion.p 
                    className="text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                  >
                    Welcome to Mafia Empire, where the streets are yours for the taking.
                    Build your criminal empire, form powerful alliances, and leave your mark
                    on the underworld.
                  </motion.p>
                </motion.div>
                
                <div className="space-y-6">
                  <AnimatedFeature 
                    title="Commit Crimes" 
                    description="From petty theft to elaborate heists, climb your way up the criminal ladder." 
                    icon={<TommyGunIcon size="md" />}
                    delay={1.0}
                  />
                  
                  <AnimatedFeature 
                    title="Form a Gang" 
                    description="Recruit loyal members and establish a feared criminal organization." 
                    icon={<FedoraIcon size="md" />}
                    delay={1.2}
                  />
                  
                  <AnimatedFeature 
                    title="Control Territory" 
                    description="Expand your influence and dominate the city district by district." 
                    icon={<TommyGunIcon size="md" />}
                    delay={1.4}
                  />
                  
                  <AnimatedFeature 
                    title="Build an Empire" 
                    description="Develop businesses, launder money, and become the ultimate crime boss." 
                    icon={<MoneyBriefcaseIcon size="md" />}
                    delay={1.6}
                  />
                </div>
              </div>
              
              {/* Mafia character image */}
              <motion.div 
                className="flex-1 flex items-center justify-center overflow-hidden hidden lg:block max-w-[300px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.03, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none rounded-md"></div>
                  <img 
                    src={mafiaCharacterImg} 
                    alt="Mafia Character" 
                    className="object-cover rounded-md shadow-xl w-full"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AnimatedFeature({ 
  title, 
  description, 
  icon, 
  delay = 0 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  delay?: number;
}) {
  return (
    <motion.div 
      className="flex items-start"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <motion.div 
        className="mr-4 p-2 bg-primary/10 rounded-sm text-primary"
        whileHover={{ 
          scale: 1.1, 
          rotate: 5, 
          backgroundColor: "rgba(var(--primary) / 0.2)" 
        }}
        whileTap={{ scale: 0.9 }}
      >
        {icon}
      </motion.div>
      <div>
        <motion.h3 
          className="font-medium mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.3 }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.3 }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
}
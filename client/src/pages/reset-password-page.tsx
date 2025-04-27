import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);
  
  // Validate token
  const { data: tokenValidation, isLoading: validating } = useQuery({
    queryKey: ["/api/reset-password/validate", token],
    queryFn: async () => {
      if (!token) return { valid: false };
      const res = await apiRequest("GET", `/api/reset-password/${token}/validate`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to validate token");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });
  
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        token,
        password: data.password,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been successfully reset. You can now log in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ResetPasswordFormValues) {
    resetPasswordMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="border-primary/20 shadow-lg bg-background/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="py-4">
                <Alert className="mb-4 bg-green-900/20 border-green-700/50">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    Your password has been successfully reset.
                    You can now log in with your new password.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center mt-6">
                  <Button asChild>
                    <Link href="/auth">Return to Login</Link>
                  </Button>
                </div>
              </div>
            ) : validating ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validating your reset token...</p>
              </div>
            ) : !token || (tokenValidation && !tokenValidation.valid) ? (
              <div className="py-4">
                <Alert className="mb-4 bg-red-900/20 border-red-700/50" variant="destructive">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertTitle>Invalid Token</AlertTitle>
                  <AlertDescription>
                    The password reset link is invalid or has expired.
                    Please request a new password reset link.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center mt-6">
                  <Button asChild>
                    <Link href="/forgot-password">Request New Reset Link</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your new password"
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your new password"
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          {!submitted && !validating && (token && tokenValidation?.valid) && (
            <CardFooter className="flex justify-center">
              <Button asChild variant="link">
                <Link href="/auth">Back to Login</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
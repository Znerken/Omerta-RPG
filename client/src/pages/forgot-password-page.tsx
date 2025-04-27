import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ResetTokenData {
  token: string;
  username: string;
  resetLink: string;
}

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [resetData, setResetData] = useState<ResetTokenData | null>(null);
  const [copied, setCopied] = useState(false);
  
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to process request");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.token && data.resetLink) {
        setResetData(data);
        toast({
          title: "Reset token generated",
          description: `A reset token has been generated for ${data.username}.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate reset token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ForgotPasswordFormValues) {
    forgotPasswordMutation.mutate(data);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Reset link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="border-primary/20 shadow-lg bg-background/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted && resetData ? (
              <div className="py-4">
                <Alert className="mb-4 bg-green-900/20 border-green-700/50">
                  <Check className="h-4 w-4 text-green-400" />
                  <AlertTitle>Reset token generated</AlertTitle>
                  <AlertDescription>
                    A password reset token has been generated for {resetData.username}.
                  </AlertDescription>
                </Alert>
                
                <div className="mb-6 mt-4">
                  <div className="border rounded-md p-3 mb-3 bg-background/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Reset Link</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => copyToClipboard(`${window.location.origin}${resetData.resetLink}`)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs bg-background/70 p-2 rounded break-all">
                      {window.location.origin}{resetData.resetLink}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-center mt-6">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/auth">Back to Login</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href={resetData.resetLink}>Reset Password</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email address"
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
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Reset Token...
                      </>
                    ) : (
                      "Generate Reset Token"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          {!submitted && (
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
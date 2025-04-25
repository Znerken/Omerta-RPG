import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MessageComposerProps {
  onSendMessage: (content: string) => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export function MessageComposer({
  onSendMessage,
  placeholder = "Type your message...",
  disabled = false,
  disabledMessage = "You cannot send messages here",
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || isSending) {
      return;
    }
    
    setIsSending(true);
    try {
      const success = await onSendMessage(message.trim());
      if (success) {
        setMessage("");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (disabled) {
    return (
      <Alert className="bg-dark border-gray-700">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{disabledMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="min-h-20 resize-none bg-dark border-gray-700"
          disabled={isSending}
        />
      </div>
      <Button 
        type="submit" 
        className="bg-primary hover:bg-primary/80"
        disabled={!message.trim() || isSending}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

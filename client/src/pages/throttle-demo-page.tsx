import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThrottleButton } from '@/components/ui/throttle-button';
import { ThrottledInput } from '@/components/ui/throttled-input';
import { useThrottle, useDebounce, useThrottledAsync } from '@/hooks/use-throttle';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';

export default function ThrottleDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Simple click throttling
  const [throttledClick, isThrottling] = useThrottle(() => {
    setClickCount(prev => prev + 1);
    toast({
      title: 'Throttled Click',
      description: `Click count: ${clickCount + 1}`,
    });
  }, 1000);
  
  // Debounced search
  const [debouncedSearch, isSearchPending, cancelSearch] = useDebounce((query: string) => {
    // Simulate search - in real app, this would be an API call
    console.log('Searching for:', query);
    setResults([
      `Result 1 for "${query}"`,
      `Result 2 for "${query}"`,
      `Result 3 for "${query}"`,
    ]);
  }, 500);
  
  // Throttled async API call
  const { 
    execute: makeApiCall, 
    status, 
    isLoading 
  } = useThrottledAsync(async () => {
    try {
      // This would be an actual API call in a real app
      setApiCallCount(count => count + 1);
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return { success: true };
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, { delay: 2000 });
  
  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-center mb-10">
        Responsive Interaction Throttling
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Throttle Button Demo */}
        <Card>
          <CardHeader>
            <CardTitle>ThrottleButton Component</CardTitle>
            <CardDescription>
              Prevents rapid multiple clicks by throttling the onClick handler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p>Click Count: <span className="font-bold">{clickCount}</span></p>
              <ThrottleButton 
                onClick={() => setClickCount(prev => prev + 1)}
                variant="default"
                throttleDelay={1000}
              >
                Increment (1s throttle)
              </ThrottleButton>
            </div>
            
            <div className="flex items-center justify-between">
              <p>Manual throttle state: <span className="font-bold">{isThrottling ? 'Throttling' : 'Ready'}</span></p>
              <Button 
                variant="outline" 
                className="w-48" 
                onClick={throttledClick}
                disabled={isThrottling}
              >
                {isThrottling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  'Manual Throttle (1s)'
                )}
              </Button>
            </div>
            
            <div>
              <ThrottleButton 
                onClick={() => toast({
                  title: 'Custom Throttle Text',
                  description: 'This button shows custom text while throttling',
                })}
                throttleText="Processing..."
                className="w-full"
                variant="secondary"
                throttleDelay={2000}
              >
                With Custom Throttle Text
              </ThrottleButton>
            </div>
          </CardContent>
        </Card>
        
        {/* ThrottledInput Demo */}
        <Card>
          <CardHeader>
            <CardTitle>ThrottledInput Component</CardTitle>
            <CardDescription>
              Prevents excessive updates during rapid typing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ThrottledInput
              label="Debounced Input (300ms)"
              placeholder="Type here..."
              value={inputValue}
              onChange={setInputValue}
              showLoading
            />
            
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-1">Current Value:</p>
              <p className="font-mono bg-muted p-2 rounded">{inputValue || '(empty)'}</p>
            </div>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search with debounce..."
                  className="pl-8 pr-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                />
                {isSearchPending && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {results.length > 0 && (
                <div className="mt-2 rounded-md border bg-popover p-2 shadow-md">
                  <p className="text-xs text-muted-foreground mb-1">Results:</p>
                  <ul className="space-y-1">
                    {results.map((result, i) => (
                      <li key={i} className="text-sm">{result}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* API Request Throttling */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>API Request Throttling</CardTitle>
            <CardDescription>
              Prevents server overload by limiting API request frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <Button 
                onClick={makeApiCall} 
                disabled={isLoading}
                className="w-full sm:w-auto"
                variant="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Make Throttled API Call'
                )}
              </Button>
              
              <p className="text-muted-foreground">
                Status: <span className="font-medium">{status}</span>
              </p>
              
              <p className="text-muted-foreground">
                API Calls Made: <span className="font-medium">{apiCallCount}</span>
              </p>
              
              <p className="text-xs text-muted-foreground">
                (Limited to once every 2 seconds)
              </p>
            </div>
            
            <div className="bg-muted p-4 rounded-md text-sm">
              <p className="font-semibold mb-2">How Throttled API Calls Work:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Prevents rapid sequential API calls</li>
                <li>Adds cooldown periods between requests</li>
                <li>Shows loading state with configurable delay</li>
                <li>Handles aborting previous requests if a new one arrives</li>
                <li>Provides detailed status tracking (idle/loading/success/error)</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Users, DollarSign, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gang } from "@shared/schema";

interface GangCardProps {
  gang: Gang & { members?: { username: string; rank: string }[] };
  isUserInGang: boolean;
  userRank?: string;
}

export function GangCard({ gang, isUserInGang, userRank }: GangCardProps) {
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canWithdraw = isUserInGang && (userRank === "Leader" || userRank === "Officer");

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gang.id}/bank`, {
        action: "deposit",
        amount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      setIsDepositDialogOpen(false);
      setDepositAmount("");
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gang.id}/bank`, {
        action: "withdraw",
        amount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      setIsDepositDialogOpen(false);
      setWithdrawAmount("");
    },
    onError: (error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  return (
    <Card className="bg-dark-surface">
      <CardHeader>
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center mr-4">
            <span className="font-heading text-2xl">{gang.tag}</span>
          </div>
          <div>
            <CardTitle className="text-xl">{gang.name}</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              <span className="inline-flex items-center mr-3">
                <Users className="h-4 w-4 mr-1" /> {gang.members?.length || 0} Members
              </span>
              <span className="inline-flex items-center">
                <DollarSign className="h-4 w-4 mr-1" /> {formatCurrency(gang.bankBalance)} Bank
              </span>
            </CardDescription>
          </div>
        </div>
        {gang.description && <p className="text-sm text-gray-400">{gang.description}</p>}
      </CardHeader>
      
      <CardContent>
        <h5 className="font-medium mb-2">Gang Members</h5>
        <div className="bg-dark-lighter p-3 rounded-md mb-4 max-h-32 overflow-y-auto">
          <ul className="space-y-1">
            {gang.members && gang.members.map((member, index) => (
              <li key={index} className="flex justify-between">
                <span className="text-gray-200">{member.username}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  member.rank === "Leader" 
                    ? "bg-primary bg-opacity-20 text-primary" 
                    : member.rank === "Officer"
                    ? "bg-blue-600 bg-opacity-20 text-blue-400"
                    : "bg-gray-600 bg-opacity-20 text-gray-400"
                }`}>
                  {member.rank}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <h5 className="font-medium mb-2">Gang Activity</h5>
        <div className="bg-dark-lighter p-3 rounded-md mb-4 h-32 overflow-y-auto">
          <ul className="space-y-2 text-sm">
            <li className="flex">
              <span className="text-gray-400 w-32 flex-shrink-0"><Clock className="h-3 w-3 mr-1 inline" /> Just now</span>
              <span><span className="text-secondary">{gang.members?.[0]?.username || "Member"}</span> added to the gang</span>
            </li>
            <li className="flex">
              <span className="text-gray-400 w-32 flex-shrink-0"><Clock className="h-3 w-3 mr-1 inline" /> 2 hours ago</span>
              <span><span className="text-secondary">Bank deposit</span> of <span className="text-green-500">{formatCurrency(1000)}</span></span>
            </li>
            <li className="flex">
              <span className="text-gray-400 w-32 flex-shrink-0"><Clock className="h-3 w-3 mr-1 inline" /> 1 day ago</span>
              <span><span className="text-secondary">Gang created</span> by <span className="text-blue-500">{gang.members?.find(m => m.rank === "Leader")?.username || "Leader"}</span></span>
            </li>
          </ul>
        </div>
      </CardContent>
      
      {isUserInGang && (
        <CardFooter className="grid grid-cols-2 gap-3">
          <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-dark-lighter hover:bg-opacity-80">
                <DollarSign className="h-4 w-4 mr-2" /> Deposit/Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-surface border-gray-700">
              <DialogHeader>
                <DialogTitle>Gang Bank</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Current balance: {formatCurrency(gang.bankBalance)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit">Deposit Amount</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="deposit"
                      type="number"
                      placeholder="Amount to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="1"
                      className="bg-dark-lighter border-gray-700"
                    />
                    <Button 
                      onClick={handleDeposit} 
                      disabled={depositMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Deposit
                    </Button>
                  </div>
                </div>
                
                {canWithdraw && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div className="space-y-2">
                      <Label htmlFor="withdraw">Withdraw Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="withdraw"
                          type="number"
                          placeholder="Amount to withdraw"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          min="1"
                          max={gang.bankBalance.toString()}
                          className="bg-dark-lighter border-gray-700"
                        />
                        <Button 
                          onClick={handleWithdraw} 
                          disabled={withdrawMutation.isPending}
                          className="bg-primary hover:bg-primary/80"
                        >
                          Withdraw
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">Only Leaders and Officers can withdraw funds</p>
                    </div>
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDepositDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="bg-dark-lighter hover:bg-opacity-80">
            <MessageSquare className="h-4 w-4 mr-2" /> Gang Chat
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

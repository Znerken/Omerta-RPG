import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CrimeResultModalProps {
  result: {
    success: boolean;
    cashReward?: number;
    xpReward?: number;
    caught?: boolean;
    message: string;
    levelUp?: boolean;
  };
  crimeName: string;
  onClose: () => void;
  onRepeat?: () => void;
}

export function CrimeResultModal({
  result,
  crimeName,
  onClose,
  onRepeat
}: CrimeResultModalProps) {
  const { success, caught, cashReward, xpReward, message, levelUp } = result;

  const getIcon = () => {
    if (success) {
      return <CheckCircle className="text-success text-4xl" />;
    } else if (caught) {
      return <AlertTriangle className="text-warning text-4xl" />;
    } else {
      return <XCircle className="text-danger text-4xl" />;
    }
  };

  const getTitle = () => {
    if (success) {
      return "Crime Successful!";
    } else if (caught) {
      return "Busted!";
    } else {
      return "Crime Failed";
    }
  };

  const getColor = () => {
    if (success) {
      return "bg-success";
    } else if (caught) {
      return "bg-warning";
    } else {
      return "bg-danger";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-dark-surface rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full ${getColor()} bg-opacity-20 flex items-center justify-center mx-auto mb-4`}>
            {getIcon()}
          </div>
          <h3 className="text-2xl font-heading mb-2">{getTitle()}</h3>
          <p className="text-gray-400">{message || `You ${success ? 'successfully' : 'failed to'} ${crimeName.toLowerCase()}.`}</p>
          {levelUp && (
            <p className="text-secondary font-bold mt-2">Level Up! You've gained a level!</p>
          )}
        </div>
        
        {success && (
          <div className="bg-dark-lighter rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Cash Earned:</span>
              <span className="text-green-500 font-mono font-bold">+{formatCurrency(cashReward || 0)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">XP Gained:</span>
              <span className="text-blue-500 font-mono font-bold">+{xpReward} XP</span>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex space-x-3">
          {onRepeat && (
            <Button 
              className="flex-1 bg-primary hover:bg-primary/80 text-white" 
              onClick={onRepeat}
            >
              Do it Again
            </Button>
          )}
          <Button 
            className="flex-1 bg-dark-lighter hover:bg-opacity-80 text-white" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

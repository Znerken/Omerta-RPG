import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, DollarSign, Zap, Skull, ShieldCheck, Clock, Shield, Briefcase, Award } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      return <CheckCircle className="text-green-400 h-9 w-9" />;
    } else if (caught) {
      return <Shield className="text-red-400 h-9 w-9" />;
    } else {
      return <XCircle className="text-yellow-400 h-9 w-9" />;
    }
  };

  const getTitle = () => {
    if (success) {
      return "OPERATION SUCCESSFUL";
    } else if (caught) {
      return "BUSTED BY AUTHORITIES";
    } else {
      return "OPERATION FAILED";
    }
  };

  const getSubTitle = () => {
    if (success) {
      return "Clean Execution";
    } else if (caught) {
      return "Law Enforcement Intervention";
    } else {
      return "Mission Compromised";
    }
  };

  const getColor = () => {
    if (success) {
      return {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-400",
        gradientFrom: "from-green-900",
        gradientTo: "to-green-700"
      };
    } else if (caught) {
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30", 
        text: "text-red-400",
        gradientFrom: "from-red-900",
        gradientTo: "to-red-700"
      };
    } else {
      return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        gradientFrom: "from-yellow-900",
        gradientTo: "to-yellow-700"
      };
    }
  };

  const colors = getColor();
  
  // Animation variants for elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  const stampVariants = {
    hidden: { scale: 1.5, opacity: 0, rotate: 15 },
    visible: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.3
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="paper-texture texture-paper dark-card p-0 max-w-md mx-auto border-0 shadow-dramatic overflow-hidden">
        {/* Header Banner */}
        <div className={cn(
          "relative p-4 pb-6 border-b", 
          colors.border,
          "bg-gradient-to-r",
          colors.gradientFrom,
          colors.gradientTo
        )}>
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative z-10"
          >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-white/80" />
                <span className="text-xs font-mono text-white/80 tracking-wider uppercase">Case File #C{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
              </div>
              <span className="text-xs font-mono text-white/80">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </motion.div>
            
            <motion.h3 variants={itemVariants} className="text-xl font-heading text-white mt-2 mb-1 tracking-wide drop-shadow-glow">
              {getTitle()}
            </motion.h3>
            <motion.p variants={itemVariants} className="text-sm text-white/70 italic">
              {getSubTitle()}: <span className="text-white/90 font-medium not-italic">{crimeName}</span>
            </motion.p>
          </motion.div>
          
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-opacity-10 mix-blend-overlay">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full -translate-x-12 translate-y-12"></div>
          </div>
        </div>
        
        {/* Status Stamp - shows based on result */}
        <motion.div 
          variants={stampVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-12 right-4 transform"
        >
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center border-2 -rotate-12",
            success ? "border-green-500/50" : caught ? "border-red-500/50" : "border-yellow-500/50",
            success ? "bg-green-500/10" : caught ? "bg-red-500/10" : "bg-yellow-500/10"
          )}>
            <div className={cn(
              "h-20 w-20 rounded-full border",
              success ? "border-green-500/70" : caught ? "border-red-500/70" : "border-yellow-500/70",
              "flex items-center justify-center flex-col"
            )}>
              {getIcon()}
              <span className={cn(
                "text-xs font-bold mt-1 uppercase tracking-wider",
                success ? "text-green-400" : caught ? "text-red-400" : "text-yellow-400"
              )}>
                {success ? "Success" : caught ? "Arrested" : "Failed"}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Content Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="p-6"
        >
          {/* Report Description */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-start space-x-3">
              <div className={cn(
                "h-8 w-1 rounded-full flex-shrink-0",
                colors.bg,
                colors.border
              )}></div>
              <div>
                <h4 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-1">
                  Operation Report
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  {message || `You ${success ? 'successfully executed' : caught ? 'were caught during' : 'failed to complete'} the ${crimeName.toLowerCase()} operation.`}
                </p>
                {levelUp && (
                  <div className="mt-3 flex items-center bg-secondary/10 p-2 rounded-sm border border-secondary/20">
                    <Award className="h-5 w-5 mr-2 text-secondary" />
                    <span className="text-sm font-medium text-secondary">Rank Promotion! Your criminal reputation has increased.</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Results Detail Section */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Operation Results
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Cash Reward */}
              <div className={cn(
                "flex items-center p-3 rounded-sm",
                success ? "bg-black/40 border-l-4 border-green-500" : "bg-black/20 border border-border/40"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                  success ? "bg-green-500/20 border border-green-500/30" : "bg-muted/30"
                )}>
                  <DollarSign className={cn(
                    "h-5 w-5",
                    success ? "text-green-400" : "text-muted-foreground/50"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cash Proceeds</span>
                    <span className={cn(
                      "font-mono text-sm",
                      success ? "text-green-400" : "text-muted-foreground"
                    )}>
                      {success 
                        ? `+${formatCurrency(cashReward || 0)}` 
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {success 
                      ? "Untraceable funds acquired" 
                      : caught 
                        ? "Assets seized by authorities" 
                        : "No financial gain"}
                  </div>
                </div>
              </div>
              
              {/* Experience Gain */}
              <div className={cn(
                "flex items-center p-3 rounded-sm",
                success ? "bg-black/40 border-l-4 border-blue-500" : "bg-black/20 border border-border/40"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                  success ? "bg-blue-500/20 border border-blue-500/30" : "bg-muted/30"
                )}>
                  <Zap className={cn(
                    "h-5 w-5",
                    success ? "text-blue-400" : "text-muted-foreground/50"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Criminal Experience</span>
                    <span className={cn(
                      "font-mono text-sm",
                      success ? "text-blue-400" : "text-muted-foreground"
                    )}>
                      {success 
                        ? `+${xpReward} XP` 
                        : caught 
                          ? "+5 XP" 
                          : "+2 XP"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {success 
                      ? "Valuable skills acquired" 
                      : caught 
                        ? "Learned from mistakes" 
                        : "Minor insights gained"}
                  </div>
                </div>
              </div>
              
              {/* Law Enforcement Status */}
              <div className={cn(
                "flex items-center p-3 rounded-sm",
                caught ? "bg-black/40 border-l-4 border-red-500" : "bg-black/20 border border-border/40"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                  caught ? "bg-red-500/20 border border-red-500/30" : "bg-muted/30"
                )}>
                  <ShieldCheck className={cn(
                    "h-5 w-5",
                    caught ? "text-red-400" : "text-muted-foreground/50"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Law Enforcement Status</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {caught 
                      ? "Identity compromised, processed by authorities" 
                      : success 
                        ? "Clean getaway, no evidence trail" 
                        : "Evaded authorities, no identification"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-black/30">
          {onRepeat && (
            <Button 
              className={cn(
                "flex items-center gap-2 uppercase tracking-wide font-medium shadow-glow-red",
                caught ? "opacity-50 cursor-not-allowed" : ""
              )}
              variant="default"
              onClick={caught ? undefined : onRepeat}
              disabled={caught}
            >
              <Briefcase className="h-4 w-4" />
              <span>Repeat Operation</span>
            </Button>
          )}
          <Button 
            className="uppercase tracking-wide font-medium bg-black/50 hover:bg-black/70 border border-border/30"
            variant="outline"
            onClick={onClose}
          >
            Close Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

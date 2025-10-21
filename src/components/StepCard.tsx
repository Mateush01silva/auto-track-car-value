import { LucideIcon } from "lucide-react";

interface StepCardProps {
  icon: LucideIcon;
  step: number;
  title: string;
  description: string;
  delay?: number;
}

const StepCard = ({ icon: Icon, step, title, description, delay = 0 }: StepCardProps) => {
  return (
    <div 
      className="relative flex flex-col items-center text-center animate-scale-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative mb-6">
        <div className="absolute -top-3 -right-3 bg-success text-success-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
          {step}
        </div>
        <div className="bg-gradient-to-br from-primary to-primary-hover p-6 rounded-2xl shadow-lg">
          <Icon className="w-10 h-10 text-primary-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-xs">
        {description}
      </p>
    </div>
  );
};

export default StepCard;

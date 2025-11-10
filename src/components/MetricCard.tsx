import { Card } from "@/components/ui/card";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendValue?: string;
  sparklineData?: number[];
  iconBgColor?: string;
  onClick?: () => void;
  clickable?: boolean;
  actionCard?: boolean;
  bgColor?: string;
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  sparklineData,
  iconBgColor = "bg-primary",
  onClick,
  clickable = false,
  actionCard = false,
  bgColor
}: MetricCardProps) => {
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-8 mt-2" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
      </svg>
    );
  };

  return (
    <Card
      className={cn(
        "p-6 transition-all",
        clickable && "hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        !clickable && "hover:shadow-lg",
        bgColor
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        </div>
        <div className={`${iconBgColor} p-3 rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {actionCard && clickable && (
        <div className="mt-3 flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          <span>View {value} Items</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      )}
      {!actionCard && (trend || trendValue) && (
        <div className="mt-2">
          {trendValue && (
            <p className={`text-sm font-medium ${
              trendValue.startsWith('+') ? 'text-success' :
              trendValue.startsWith('-') ? 'text-destructive' :
              'text-muted-foreground'
            }`}>
              {trendValue}
            </p>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
      )}
      {renderSparkline()}
    </Card>
  );
};

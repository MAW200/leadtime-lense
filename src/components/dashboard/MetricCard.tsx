import { Card } from "@/components/ui/card";
import { LucideIcon, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
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
  iconBgColor = "bg-gradient-to-br from-primary to-blue-600",
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
      <svg className="w-full h-12 mt-3 opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,100 ${points} 100,100`}
          fill="url(#sparkline-gradient)"
          className="text-primary"
        />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
      </svg>
    );
  };

  const isPositiveTrend = trendValue?.startsWith('+');
  const isNegativeTrend = trendValue?.startsWith('-');

  return (
    <Card
      className={cn(
        "group relative p-6 transition-all duration-300 overflow-hidden border-border/50",
        "hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30",
        clickable && "hover:scale-[1.02] cursor-pointer",
        actionCard && "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20",
        bgColor
      )}
      onClick={onClick}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground/80 mb-2.5 tracking-wide uppercase">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </h3>
          </div>

          {/* Modern icon with gradient Background */}
          <div className={cn(
            iconBgColor,
            "p-3.5 rounded-2xl shadow-lg transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl"
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Action Card Call to Action */}
        {actionCard && clickable && (
          <div className="mt-4 flex items-center text-sm font-semibold text-destructive group-hover:text-destructive/80 transition-colors">
            <span>View {value} Items</span>
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}

        {/* Trend Display with Icons */}
        {!actionCard && (trend || trendValue) && (
          <div className="mt-4 flex items-center gap-3">
            {trendValue && (
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold",
                isPositiveTrend && "bg-success/10 text-success",
                isNegativeTrend && "bg-destructive/10 text-destructive",
                !isPositiveTrend && !isNegativeTrend && "bg-muted text-muted-foreground"
              )}>
                {isPositiveTrend && <TrendingUp className="h-3.5 w-3.5" />}
                {isNegativeTrend && <TrendingDown className="h-3.5 w-3.5" />}
                <span>{trendValue}</span>
              </div>
            )}
            {trend && (
              <p className="text-xs text-muted-foreground/70">{trend}</p>
            )}
          </div>
        )}

        {/* Sparkline Chart */}
        {renderSparkline()}
      </div>
    </Card>
  );
};

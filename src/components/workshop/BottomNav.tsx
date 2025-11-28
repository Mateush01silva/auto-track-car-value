import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Users,
  MoreHorizontal,
  Settings,
  FileText,
  CreditCard,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isAction?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/workshop/dashboard" },
  { icon: PlusCircle, label: "Novo", path: "/workshop/new-service", isAction: true },
  { icon: History, label: "Histórico", path: "/workshop/history" },
  { icon: Users, label: "Clientes", path: "/workshop/clients" },
];

const MORE_ITEMS = [
  { icon: TrendingUp, label: "Oportunidades", path: "/workshop/opportunities" },
  { icon: FileText, label: "Templates", path: "/workshop/templates" },
  { icon: Settings, label: "Configurações", path: "/workshop/settings" },
  { icon: CreditCard, label: "Planos", path: "/workshop/plans" },
];

export function WorkshopBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors",
                "active:bg-muted/50",
                item.isAction && "relative"
              )}
            >
              {item.isAction ? (
                <div className="absolute -top-4 bg-primary rounded-full p-3 shadow-lg">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "h-5 w-5 mb-1",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      active ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full px-2 active:bg-muted/50">
              <MoreHorizontal className="h-5 w-5 mb-1 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="cursor-pointer"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

export default WorkshopBottomNav;

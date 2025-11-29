import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Package, FileText, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ['admin', 'manager'] as UserRole[],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ['admin', 'manager'] as UserRole[],
  },
  {
    title: "Bills",
    href: "/bills",
    icon: FileText,
    roles: ['admin', 'manager', 'staff'] as UserRole[],
  },
  {
    title: "Create Bill",
    href: "/create-bill",
    icon: Plus,
    roles: ['admin', 'manager', 'staff'] as UserRole[],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ['admin', 'manager'] as UserRole[],
  },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">K K Foods</h1>
        <p className="text-sm text-muted-foreground mt-1">Inventory & Billing</p>
        {user && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground">User: {user.name}</p>
          </div>
        )}
      </div>
      <nav className="px-3 space-y-1 flex-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-foreground hover:bg-accent/50"
            )}
            activeClassName="bg-primary text-primary-foreground hover:bg-primary"
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
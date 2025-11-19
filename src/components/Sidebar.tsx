import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Package, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Bills",
    href: "/bills",
    icon: FileText,
  },
  {
    title: "Create Bill",
    href: "/create-bill",
    icon: Plus,
  },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">K K Foods</h1>
        <p className="text-sm text-muted-foreground mt-1">Inventory & Billing</p>
      </div>
      <nav className="px-3 space-y-1">
        {navItems.map((item) => (
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
    </aside>
  );
};

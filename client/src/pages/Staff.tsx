import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Package, ShoppingBag, RefreshCw, LogOut, Home } from "lucide-react";
import { Link } from "wouter";
import StaffInventory from "./StaffInventory";
import StaffOrders from "./StaffOrders";
import StaffRefunds from "./StaffRefunds";

export default function Staff() {
  const [location, setLocation] = useLocation();
  const { user, logout, isStaff } = useAuth();

  useEffect(() => {
    if (!isStaff) {
      setLocation("/");
    }
  }, [isStaff, setLocation]);

  if (!isStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-sidebar p-6 sticky top-0 h-screen">
        <div className="mb-8">
          <Link href="/">
            <a className="flex items-center gap-2 mb-6 hover-elevate active-elevate-2 rounded-md p-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold font-serif">BookHaven</span>
            </a>
          </Link>
          <div className="space-y-1">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

        <nav className="space-y-2 mb-8">
          <Link href="/staff/inventory">
            <Button
              variant={location.includes("/staff/inventory") ? "default" : "ghost"}
              className="w-full justify-start"
              data-testid="link-inventory"
            >
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Button>
          </Link>
          <Link href="/staff/orders">
            <Button
              variant={location.includes("/staff/orders") ? "default" : "ghost"}
              className="w-full justify-start"
              data-testid="link-orders"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </Button>
          </Link>
          <Link href="/staff/refunds">
            <Button
              variant={location.includes("/staff/refunds") ? "default" : "ghost"}
              className="w-full justify-start"
              data-testid="link-refunds"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refunds
            </Button>
          </Link>
        </nav>

        <div className="border-t pt-4 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start" data-testid="link-home">
              <Home className="h-4 w-4 mr-2" />
              Customer View
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Switch>
          <Route path="/staff/inventory" component={StaffInventory} />
          <Route path="/staff/orders" component={StaffOrders} />
          <Route path="/staff/refunds" component={StaffRefunds} />
          <Route path="/staff">
            <StaffInventory />
          </Route>
        </Switch>
      </main>
    </div>
  );
}

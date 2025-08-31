import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Moon, Sun, LogOut, BarChart3, Calculator, CreditCard, Home, Users } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import BillCalculator from "@/components/BillCalculator";
import PaymentTracker from "@/components/PaymentTracker";
import Analytics from "@/components/Analytics";
import DormerManagement from "@/components/DormerManagement";

export default function DormLayout() {
  const { user, logout } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold">DormMaster</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="hidden md:block text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{user?.displayName || user?.email || "Admin"}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2" data-testid="tab-dashboard">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
              <span className="md:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="dormers" className="flex items-center space-x-2" data-testid="tab-dormers">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Dormers</span>
              <span className="md:hidden">People</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center space-x-2" data-testid="tab-calculator">
              <Calculator className="h-4 w-4" />
              <span className="hidden md:inline">Bill Calculator</span>
              <span className="md:hidden">Bills</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2" data-testid="tab-payments">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Payments</span>
              <span className="md:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Analytics</span>
              <span className="md:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="dormers">
            <DormerManagement />
          </TabsContent>
          
          <TabsContent value="calculator">
            <BillCalculator />
          </TabsContent>
          
          <TabsContent value="payments">
            <PaymentTracker />
          </TabsContent>
          
          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

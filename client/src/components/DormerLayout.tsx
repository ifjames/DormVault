import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Moon, Sun, LogOut, Calculator, CreditCard, Calendar } from "lucide-react";
import DormerAttendance from "@/components/DormerAttendance";
import BillCalculator from "@/components/BillCalculator";
import DormerBills from "@/components/DormerBills";

export default function DormerLayout() {
  const { user, logout } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("attendance");

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
              <h1 className="text-xl font-semibold">DormVault - Dormer</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="hidden md:block text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{user?.displayName || user?.email || "Dormer"}</span>
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="attendance" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Bill Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>My Bills</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <DormerAttendance />
          </TabsContent>
          
          <TabsContent value="calculator">
            <BillCalculator />
          </TabsContent>
          
          <TabsContent value="bills">
            <DormerBills />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
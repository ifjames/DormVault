import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Calculator, CreditCard, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/95 dark:bg-gray-900/95 border border-white/20">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Building className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              DormMaster
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Dormitory Management System
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Electricity Bill Calculator</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Payment Tracking</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Analytics & Reports</span>
            </div>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full py-3 text-lg font-medium"
            data-testid="button-login"
          >
            Sign In to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

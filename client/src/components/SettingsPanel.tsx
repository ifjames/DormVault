import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Calendar, History, Users } from "lucide-react";
import BillingPeriodManager from "@/components/BillingPeriodManager";
import AttendanceHistory from "@/components/AttendanceHistory";

export default function SettingsPanel() {
  const [activeSettingsTab, setActiveSettingsTab] = useState("billing");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Administrative Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="billing" className="flex items-center space-x-2" data-testid="settings-tab-billing">
                <Calendar className="h-4 w-4" />
                <span>Billing Period</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center space-x-2" data-testid="settings-tab-attendance">
                <History className="h-4 w-4" />
                <span>Attendance History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing" className="space-y-4">
              <BillingPeriodManager />
            </TabsContent>
            
            <TabsContent value="attendance" className="space-y-4">
              <AttendanceHistory />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
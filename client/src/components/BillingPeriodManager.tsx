import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { db, COLLECTIONS } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Calendar, Settings, History, Users, TrendingUp } from "lucide-react";

interface BillingPeriod {
  startDate: string;
  endDate: string;
}

interface AttendanceSummary {
  dormerId: string;
  dormerName: string;
  daysStayed: number;
  totalDays: number;
  attendanceRate: number;
}

export default function BillingPeriodManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPeriod, setNewPeriod] = useState<BillingPeriod>({ startDate: "", endDate: "" });
  const [showHistory, setShowHistory] = useState(false);

  // Fetch current billing period
  const { data: currentPeriod, isLoading } = useQuery({
    queryKey: ['billing-period'],
    queryFn: async () => {
      try {
        const docRef = doc(db, 'settings', 'billing-period');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            startDate: data.startDate,
            endDate: data.endDate
          };
        } else {
          // Return default period if none exists
          const today = new Date();
          const currentDay = today.getDate();
          
          if (currentDay < 22) {
            const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 22);
            const endDate = new Date(today.getFullYear(), today.getMonth(), 21);
            return {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          } else {
            const startDate = new Date(today.getFullYear(), today.getMonth(), 22);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 21);
            return {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          }
        }
      } catch (error) {
        console.error('Error fetching billing period:', error);
        return null;
      }
    },
  });

  // Fetch attendance summary for current period
  const { data: attendanceSummary } = useQuery({
    queryKey: ['attendance-summary', currentPeriod?.startDate, currentPeriod?.endDate],
    queryFn: async () => {
      if (!currentPeriod) return [];
      
      try {
        // Get all active dormers
        const dormersRef = collection(db, COLLECTIONS.DORMERS);
        const dormersQuery = query(dormersRef, where("isActive", "==", true));
        const dormersSnapshot = await getDocs(dormersQuery);
        
        const summaries: AttendanceSummary[] = [];
        const periodStr = `${new Date(currentPeriod.startDate).getFullYear()}-${String(new Date(currentPeriod.startDate).getMonth() + 1).padStart(2, '0')}`;
        
        for (const dormerDoc of dormersSnapshot.docs) {
          const dormerData = dormerDoc.data();
          
          // Get attendance records for this dormer
          const attendanceRef = collection(db, 'attendance');
          const attendanceQuery = query(
            attendanceRef,
            where("dormerId", "==", dormerDoc.id),
            where("month", "==", periodStr)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          
          const daysStayed = attendanceSnapshot.docs.filter(doc => doc.data().isPresent).length;
          const totalDays = Math.ceil((new Date(currentPeriod.endDate).getTime() - new Date(currentPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const attendanceRate = totalDays > 0 ? Math.round((daysStayed / totalDays) * 100) : 0;
          
          summaries.push({
            dormerId: dormerDoc.id,
            dormerName: dormerData.name,
            daysStayed,
            totalDays,
            attendanceRate
          });
        }
        
        return summaries.sort((a, b) => b.daysStayed - a.daysStayed);
      } catch (error) {
        console.error('Error fetching attendance summary:', error);
        return [];
      }
    },
    enabled: !!currentPeriod,
  });

  // Update billing period mutation
  const updatePeriodMutation = useMutation({
    mutationFn: async (period: BillingPeriod) => {
      const docRef = doc(db, 'settings', 'billing-period');
      await setDoc(docRef, {
        startDate: period.startDate,
        endDate: period.endDate,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      return period;
    },
    onSuccess: () => {
      toast({
        title: "Billing Period Updated",
        description: "The new billing period has been set successfully. All users will see the updated dates.",
      });
      queryClient.invalidateQueries({ queryKey: ['billing-period'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setNewPeriod({ startDate: "", endDate: "" });
    },
    onError: (error) => {
      console.error('Error updating billing period:', error);
      toast({
        title: "Error",
        description: "Failed to update billing period. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-populate next period
  const generateNextPeriod = () => {
    if (!currentPeriod) return;
    
    const endDate = new Date(currentPeriod.endDate);
    const newStartDate = new Date(endDate);
    newStartDate.setDate(endDate.getDate() + 1);
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newStartDate.getMonth() + 1);
    newEndDate.setDate(21);
    
    setNewPeriod({
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0]
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="mt-2 text-muted-foreground">Loading billing period...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Period Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Current Billing Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPeriod ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
                  </Badge>
                </div>
                <Button 
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  size="sm"
                >
                  <History className="h-4 w-4 mr-2" />
                  {showHistory ? 'Hide' : 'View'} Summary
                </Button>
              </div>
              
              {attendanceSummary && attendanceSummary.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{attendanceSummary.length}</div>
                    <div className="text-sm text-muted-foreground">Active Dormers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(attendanceSummary.reduce((sum, d) => sum + d.attendanceRate, 0) / attendanceSummary.length)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {attendanceSummary.reduce((sum, d) => sum + d.daysStayed, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {attendanceSummary[0]?.totalDays || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Period Days</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No billing period set. Create one below.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      {showHistory && attendanceSummary && attendanceSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Attendance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendanceSummary.map((summary, index) => (
                <div key={summary.dormerId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{summary.dormerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {summary.daysStayed} / {summary.totalDays} days
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      summary.attendanceRate >= 80 ? 'text-green-600' : 
                      summary.attendanceRate >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {summary.attendanceRate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set New Period Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Set New Billing Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newPeriod.endDate}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={generateNextPeriod}
                variant="outline"
                size="sm"
                disabled={!currentPeriod}
                data-testid="button-generate-next"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Next Period
              </Button>
              <Button
                onClick={() => updatePeriodMutation.mutate(newPeriod)}
                disabled={!newPeriod.startDate || !newPeriod.endDate || updatePeriodMutation.isPending}
                data-testid="button-update-period"
              >
                {updatePeriodMutation.isPending ? "Updating..." : "Update Period"}
              </Button>
            </div>
            
            {newPeriod.startDate && newPeriod.endDate && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  New Period Preview:
                </div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {formatDate(newPeriod.startDate)} - {formatDate(newPeriod.endDate)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Duration: {Math.ceil((new Date(newPeriod.endDate).getTime() - new Date(newPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
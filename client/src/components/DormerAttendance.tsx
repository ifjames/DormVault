import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { db, COLLECTIONS } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { Calendar, CalendarCheck, CalendarX, Info, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceDay {
  day: number;
  date: string;
  isPresent: boolean;
  note?: string;
}

interface DormerData {
  id: string;
  name: string;
  room: string;
  email: string;
  monthlyRent: string;
  role: string;
}

export default function DormerAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const [dormerData, setDormerData] = useState<DormerData | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({});
  
  // Fetch current billing period from admin settings
  const { data: billingPeriod } = useQuery({
    queryKey: ['billing-period'],
    queryFn: async () => {
      try {
        const docRef = doc(db, 'settings', 'billing-period');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate)
          };
        } else {
          // Fallback to default calculation if no admin setting exists
          const today = new Date();
          const currentDay = today.getDate();
          
          if (currentDay < 22) {
            const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 22);
            const endDate = new Date(today.getFullYear(), today.getMonth(), 21);
            return { startDate, endDate };
          } else {
            const startDate = new Date(today.getFullYear(), today.getMonth(), 22);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 21);
            return { startDate, endDate };
          }
        }
      } catch (error) {
        console.error('Error fetching billing period:', error);
        // Fallback calculation
        const today = new Date();
        const currentDay = today.getDate();
        
        if (currentDay < 22) {
          const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 22);
          const endDate = new Date(today.getFullYear(), today.getMonth(), 21);
          return { startDate, endDate };
        } else {
          const startDate = new Date(today.getFullYear(), today.getMonth(), 22);
          const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 21);
          return { startDate, endDate };
        }
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
  
  const billingPeriodStr = useMemo(() => {
    if (!billingPeriod) return '';
    return `${billingPeriod.startDate.getFullYear()}-${String(billingPeriod.startDate.getMonth() + 1).padStart(2, '0')}`;
  }, [billingPeriod]);

  // Remove debug logging

  // Fetch dormer data when user is authenticated
  useEffect(() => {
    if (user?.email) {
      const fetchDormerData = async () => {
        try {
          console.log('Fetching dormer data for email:', user.email);
          const dormersRef = collection(db, COLLECTIONS.DORMERS);
          const q = query(dormersRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const dormerDoc = querySnapshot.docs[0];
            const dormerData = { id: dormerDoc.id, ...dormerDoc.data() } as DormerData;
            console.log('Found dormer data:', dormerData);
            setDormerData(dormerData);
          } else {
            console.log('No dormer found for email:', user.email);
          }
        } catch (error) {
          console.error("Error fetching dormer data:", error);
          toast({
            title: "Error",
            description: "Failed to fetch your profile data",
            variant: "destructive",
          });
        }
      };
      
      fetchDormerData();
    }
  }, [user, toast]);

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', dormerData?.id, billingPeriodStr],
    queryFn: async () => {
      if (!dormerData?.id || !billingPeriodStr) return [];
      
      try {
        const attendanceRef = collection(db, 'attendance');
        const q = query(
          attendanceRef,
          where("dormerId", "==", dormerData.id),
          where("month", "==", billingPeriodStr)
        );
        
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return results;
      } catch (error) {
        console.error('Error fetching attendance:', error);
        return [];
      }
    },
    enabled: !!dormerData?.id && !!billingPeriodStr,
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: { dormerId: string; date: string; isPresent: boolean; note?: string }) => {
      const attendanceRef = doc(db, 'attendance', `${data.dormerId}_${data.date}`);
      const attendanceData = {
        dormerId: data.dormerId,
        date: data.date,
        month: billingPeriodStr,
        isPresent: data.isPresent,
        note: data.note || '',
        updatedAt: new Date()
      };
      await setDoc(attendanceRef, attendanceData, { merge: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      // Clear optimistic update
      setOptimisticUpdates({});
    },
    onError: (error) => {
      console.error('Attendance update error:', error);
      // Revert optimistic update
      setOptimisticUpdates({});
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    },
  });


  const isAttendanceMarked = (date: string) => {
    return attendance?.some((a: any) => a.date === date && a.isPresent) || false;
  };

  const generateBillingPeriodDays = useMemo(() => {
    if (!billingPeriod) return [];
    
    const days = [];
    const currentDate = new Date(billingPeriod.startDate);
    
    while (currentDate <= billingPeriod.endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayDate = new Date(currentDate);
      const today = new Date();
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isPast = dayDate < today;
      
      days.push({
        date: dateStr,
        day: dayDate.getDate(),
        month: dayDate.getMonth(),
        year: dayDate.getFullYear(),
        isPresent: optimisticUpdates[dateStr] ?? isAttendanceMarked(dateStr),
        isToday,
        isPast,
        dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [billingPeriod, attendance, optimisticUpdates, isAttendanceMarked]);

  const getAttendanceNote = (date: string) => {
    const record = attendance?.find((a: any) => a.date === date);
    return (record as any)?.note || '';
  };

  const updateNote = (date: string, note: string) => {
    if (!dormerData?.id) return;
    
    updateAttendanceMutation.mutate({
      dormerId: dormerData.id,
      date,
      isPresent: isAttendanceMarked(date),
      note,
    });
  };

  const toggleAttendance = useCallback((date: string) => {
    if (!dormerData?.id) return;
    
    const isCurrentlyMarked = optimisticUpdates[date] ?? isAttendanceMarked(date);
    const newStatus = !isCurrentlyMarked;
    
    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [date]: newStatus }));
    
    const currentNote = getAttendanceNote(date);
    updateAttendanceMutation.mutate({
      dormerId: dormerData.id,
      date,
      isPresent: newStatus,
      note: currentNote,
    });
  }, [dormerData?.id, optimisticUpdates, attendance, updateAttendanceMutation]);

  const getDaysStayed = () => {
    return attendance?.filter((a: any) => a.isPresent).length || 0;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (authLoading || (user && !dormerData)) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="mt-2 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">Please log in to view your stay records</div>
        </CardContent>
      </Card>
    );
  }

  const attendanceData = generateBillingPeriodDays;
  const daysStayed = getDaysStayed();
  
  if (!billingPeriod) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Stay Tracker</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {monthNames[billingPeriod.startDate.getMonth()]} {billingPeriod.startDate.getDate()} - {monthNames[billingPeriod.endDate.getMonth()]} {billingPeriod.endDate.getDate()}, {billingPeriod.endDate.getFullYear()}
            </Badge>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Days Stayed:</div>
              <div className="text-2xl font-bold text-primary">{daysStayed}</div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center space-x-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CalendarCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm">Stayed in Dorm</span>
            </div>
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Note Available</span>
            </div>
          </div>

          {/* Stay Records Grid */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-0 bg-muted text-xs font-medium">
              <div className="p-2 border-r border-b">Name</div>
              <div className="p-2 border-r border-b text-center">Day</div>
              <div className="p-2 border-r border-b text-center">Stayed</div>
              <div className="p-2 border-r border-b text-center">Note</div>
              <div className="p-2 border-b text-center">Info</div>
            </div>
            
            {attendanceData.map((attendanceItem: any, index: number) => (
              <div key={attendanceItem.date} className={`grid grid-cols-5 gap-0 border-b hover:bg-muted/30 transition-colors ${
                attendanceItem.isToday ? 'bg-blue-50 dark:bg-blue-950/20' : ''
              }`}>
                <div className="p-2 border-r font-medium text-sm">
                  {index === 0 ? dormerData?.name?.split('@')[0] || dormerData?.name || "" : ""}
                </div>
                <div className="p-2 border-r text-center font-mono text-sm flex items-center justify-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    attendanceItem.isToday ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "bg-muted"
                  )}>
                    {attendanceItem.day}
                  </div>
                </div>
                <div className="p-2 border-r text-center">
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={attendanceItem.isPresent}
                      onCheckedChange={() => toggleAttendance(attendanceItem.date)}
                      disabled={updateAttendanceMutation.isPending || isLoading}
                      data-testid={`attendance-${attendanceItem.day}`}
                      className="scale-75"
                    />
                  </div>
                </div>
                <div className="p-2 border-r text-center">
                  <input
                    type="text"
                    placeholder="Note..."
                    className="w-20 text-xs p-1 border rounded bg-background text-center"
                    value={getAttendanceNote(attendanceItem.date)}
                    onChange={(e) => updateNote(attendanceItem.date, e.target.value)}
                    disabled={updateAttendanceMutation.isPending}
                  />
                </div>
                <div className="p-2 text-center text-xs">
                  {index === 0 && (
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">
                        Billing Period
                      </div>
                      <div className="text-xs font-medium">
                        Days Stayed: <span className="text-primary">{daysStayed}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{daysStayed}</div>
                <div className="text-sm text-muted-foreground">Days Stayed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{attendanceData.length}</div>
                <div className="text-sm text-muted-foreground">Total Days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {attendanceData.length > 0 ? Math.round((daysStayed / attendanceData.length) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Occupancy Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
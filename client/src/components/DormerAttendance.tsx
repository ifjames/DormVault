import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { db, COLLECTIONS } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, orderBy } from "firebase/firestore";
import { Calendar, CalendarCheck, CalendarX, Info } from "lucide-react";

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
  const [currentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

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
    queryKey: ['attendance', dormerData?.id, currentMonthStr],
    queryFn: async () => {
      if (!dormerData?.id) return [];
      
      try {
        // Create attendance collection reference
        const attendanceRef = collection(db, 'attendance');
        const q = query(
          attendanceRef,
          where("dormerId", "==", dormerData.id),
          where("month", "==", currentMonthStr)
        );
        
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched attendance:', results);
        return results;
      } catch (error) {
        console.error('Error fetching attendance:', error);
        return [];
      }
    },
    enabled: !!dormerData?.id,
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: { dormerId: string; date: string; isPresent: boolean; note?: string }) => {
      try {
        console.log('Updating attendance:', data);
        const attendanceRef = doc(db, 'attendance', `${data.dormerId}_${data.date}`);
        const attendanceData = {
          dormerId: data.dormerId,
          date: data.date,
          month: currentMonthStr,
          isPresent: data.isPresent,
          note: data.note || '',
          updatedAt: new Date()
        };
        console.log('Saving to Firestore:', attendanceData);
        await setDoc(attendanceRef, attendanceData, { merge: true });
        console.log('Successfully saved attendance');
        return data;
      } catch (error) {
        console.error('Error saving attendance:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Attendance mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: "Attendance Updated",
        description: "Your attendance has been saved successfully",
      });
    },
    onError: (error) => {
      console.error('Attendance update error:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  const generateMonthDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
      days.push({
        date,
        day,
        isPresent: isAttendanceMarked(date),
      });
    }
    
    return days;
  };

  const isAttendanceMarked = (date: string) => {
    return attendance?.some((a: any) => a.date === date && a.isPresent) || false;
  };

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

  const toggleAttendance = (date: string) => {
    if (!dormerData?.id) return;
    
    const isCurrentlyMarked = isAttendanceMarked(date);
    const currentNote = getAttendanceNote(date);
    updateAttendanceMutation.mutate({
      dormerId: dormerData.id,
      date,
      isPresent: !isCurrentlyMarked,
      note: currentNote,
    });
  };

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
          <div className="text-muted-foreground">Please log in to view attendance</div>
        </CardContent>
      </Card>
    );
  }

  const attendanceData = generateMonthDays();
  const daysStayed = getDaysStayed();
  const today = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Attendance Tracker</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {monthNames[currentMonth]} {currentYear}
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
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <CalendarX className="h-4 w-4 text-red-600" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Note Available</span>
            </div>
          </div>

          {/* Attendance Grid */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-0 bg-muted text-xs font-medium">
              <div className="p-2 border-r border-b">Name</div>
              <div className="p-2 border-r border-b text-center">Day</div>
              <div className="p-2 border-r border-b text-center">Stayed?</div>
              <div className="p-2 border-r border-b text-center">Note</div>
              <div className="p-2 border-b text-center">Info</div>
            </div>
            
            {attendanceData.map((attendance, index) => (
              <div key={attendance.day} className={`grid grid-cols-5 gap-0 border-b hover:bg-muted/30 transition-colors ${
                isCurrentMonth && attendance.day === today ? 'bg-blue-50 dark:bg-blue-950/30' : ''
              }`}>
                <div className="p-2 border-r font-medium text-sm">
                  {index === 0 ? dormerData?.name?.split('@')[0] || dormerData?.name || "" : ""}
                </div>
                <div className="p-2 border-r text-center font-mono text-sm">
                  {attendance.day}
                  {isCurrentMonth && attendance.day === today && (
                    <Badge variant="secondary" className="ml-1 text-xs">Today</Badge>
                  )}
                </div>
                <div className="p-2 border-r text-center">
                  <Checkbox
                    checked={attendance.isPresent}
                    onCheckedChange={() => toggleAttendance(attendance.date)}
                    disabled={updateAttendanceMutation.isPending || isLoading}
                    data-testid={`attendance-${attendance.day}`}
                  />
                </div>
                <div className="p-2 border-r text-center">
                  <input
                    type="text"
                    placeholder="Add note..."
                    className="w-24 text-xs p-1 border rounded bg-background"
                    value={getAttendanceNote(attendance.date)}
                    onChange={(e) => updateNote(attendance.date, e.target.value)}
                    disabled={updateAttendanceMutation.isPending}
                  />
                </div>
                <div className="p-2 text-center text-xs">
                  {index === 0 && (
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">
                        {monthNames[currentMonth]} {1} to {monthNames[currentMonth]} {attendanceData.length}
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
                <div className="text-sm text-muted-foreground">Days Present</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceData.length - daysStayed}</div>
                <div className="text-sm text-muted-foreground">Days Absent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceData.length > 0 ? Math.round((daysStayed / attendanceData.length) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Attendance Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
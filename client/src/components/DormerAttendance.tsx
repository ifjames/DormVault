import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarCheck, CalendarX, Info } from "lucide-react";

interface AttendanceDay {
  day: number;
  date: string;
  isPresent: boolean;
  note?: string;
}

interface DormerSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
  };
  dormer: {
    id: string;
    name: string;
    room: string;
    email: string;
    monthlyRent: string;
  };
}

export default function DormerAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<DormerSession | null>(null);
  const [currentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      if (parsedSession.user?.role === 'dormer') {
        setSession(parsedSession);
      }
    }
  }, []);

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', session?.dormer?.id, currentMonthStr],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/${session?.dormer?.id}?month=${currentMonthStr}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!session?.dormer?.id,
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: { dormerId: string; date: string; isPresent: boolean }) => {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update attendance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: "Attendance Updated",
        description: "Your attendance has been recorded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attendance",
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

  const toggleAttendance = (date: string) => {
    if (!session?.dormer?.id) return;
    
    const isCurrentlyMarked = isAttendanceMarked(date);
    updateAttendanceMutation.mutate({
      dormerId: session.dormer.id,
      date,
      isPresent: !isCurrentlyMarked,
    });
  };

  const getDaysStayed = () => {
    return attendance?.filter((a: any) => a.isPresent).length || 0;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (!session) {
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
            <div className="grid grid-cols-5 gap-0 bg-muted text-sm font-medium">
              <div className="p-3 border-r border-b">Name</div>
              <div className="p-3 border-r border-b text-center">Day</div>
              <div className="p-3 border-r border-b text-center">Stayed?</div>
              <div className="p-3 border-r border-b text-center">Note</div>
              <div className="p-3 border-b text-center">Info</div>
            </div>
            
            {attendanceData.map((attendance, index) => (
              <div key={attendance.day} className={`grid grid-cols-5 gap-0 border-b hover:bg-muted/30 transition-colors ${
                isCurrentMonth && attendance.day === today ? 'bg-blue-50 dark:bg-blue-950/30' : ''
              }`}>
                <div className="p-3 border-r font-medium">
                  {index === 0 ? session.dormer.name : ""}
                </div>
                <div className="p-3 border-r text-center font-mono">
                  {attendance.day}
                  {isCurrentMonth && attendance.day === today && (
                    <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>
                  )}
                </div>
                <div className="p-3 border-r text-center">
                  <Checkbox
                    checked={attendance.isPresent}
                    onCheckedChange={() => toggleAttendance(attendance.date)}
                    disabled={updateAttendanceMutation.isPending || isLoading}
                    data-testid={`attendance-${attendance.day}`}
                  />
                </div>
                <div className="p-3 border-r text-center text-sm text-muted-foreground">
                  {/* Note field - could be expanded in the future */}
                </div>
                <div className="p-3 text-center text-sm">
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
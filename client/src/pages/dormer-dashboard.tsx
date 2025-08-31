import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Home, Calendar, LogOut, CreditCard, Zap, Wifi, Droplets } from "lucide-react";

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

export default function DormerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<DormerSession | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const sessionData = localStorage.getItem('dormer_session');
    if (sessionData) {
      setSession(JSON.parse(sessionData));
    } else {
      window.location.href = '/dormer-login';
    }
  }, []);

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', session?.dormer?.id, currentMonth],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/${session?.dormer?.id}?month=${currentMonth}`);
      return response.json();
    },
    enabled: !!session?.dormer?.id,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', session?.dormer?.id],
    queryFn: async () => {
      const response = await fetch(`/api/payments/dormer/${session?.dormer?.id}`);
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

  const handleLogout = () => {
    localStorage.removeItem('dormer_session');
    window.location.href = '/dormer-login';
  };

  const generateMonthDays = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: `${currentMonth}-${String(day).padStart(2, '0')}`,
        day: day,
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

  const getPendingPayments = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return payments?.filter((p: any) => p.status === 'pending' || p.status === 'overdue') || [];
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const monthDays = generateMonthDays();
  const daysStayed = getDaysStayed();
  const pendingPayments = getPendingPayments();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {session.dormer.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Room {session.dormer.room}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Attendance Tracking */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Attendance Tracking - {currentMonth}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Day</th>
                        <th className="text-left p-2 font-medium">Stayed?</th>
                        <th className="text-left p-2 font-medium">Note</th>
                        <th className="text-left p-2 font-medium">Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthDays.map((dayInfo) => (
                        <tr key={dayInfo.date} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                            {dayInfo.day === 1 ? session.dormer.name : ''}
                          </td>
                          <td className="p-2 font-medium">{dayInfo.day}</td>
                          <td className="p-2">
                            <Checkbox
                              checked={isAttendanceMarked(dayInfo.date)}
                              onCheckedChange={() => toggleAttendance(dayInfo.date)}
                              disabled={updateAttendanceMutation.isPending}
                              data-testid={`checkbox-attendance-${dayInfo.day}`}
                            />
                          </td>
                          <td className="p-2 text-sm text-gray-500">
                            {/* Note field - could be expanded in the future */}
                          </td>
                          <td className="p-2">
                            {dayInfo.day === Math.floor(monthDays.length / 2) && (
                              <div className="text-sm">
                                <div className="text-gray-600 dark:text-gray-400">
                                  {currentMonth.replace('-', ' ')} to Sept 24
                                </div>
                                <div className="font-medium">
                                  Days Stayed: {daysStayed}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Days Stayed</span>
                  <Badge variant="secondary">{daysStayed}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</span>
                  <span className="font-medium">₱{session.dormer.monthlyRent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Room</span>
                  <span className="font-medium">{session.dormer.room}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ) : pendingPayments.length > 0 ? (
                  pendingPayments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div>
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                          {payment.month} Payment
                        </p>
                        <p className="text-sm text-orange-600 dark:text-orange-300">
                          ₱{payment.amount}
                        </p>
                      </div>
                      <Badge variant="destructive">Due</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All payments up to date</p>
                  </div>
                )}
                
                {/* Utility Bills Status */}
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-medium text-sm">Utilities</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Electricity</span>
                    </div>
                    <Badge variant="outline">Shared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">WiFi</span>
                    </div>
                    <Badge variant="outline">Included</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Water</span>
                    </div>
                    <Badge variant="outline">Included</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
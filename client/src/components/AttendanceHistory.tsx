import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { History, Calendar, Users, TrendingUp, BarChart3, Download, Eye, UserCheck } from "lucide-react";
import { dormersService } from "@/lib/firestoreService";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface MonthlyAttendanceSummary {
  dormerId: string;
  dormerName: string;
  room: string;
  month: string;
  daysStayed: number;
  totalDays: number;
  attendanceRate: number;
  notes: string[];
  monthlyRent: number;
  estimatedRentShare: number;
}

export default function AttendanceHistory() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [selectedDormer, setSelectedDormer] = useState<string>("all");

  // Fetch all dormers
  const { data: dormers } = useQuery({
    queryKey: ["dormers"],
    queryFn: dormersService.getAll,
  });

  // Fetch attendance data for selected month
  const { data: monthlyAttendance, isLoading } = useQuery({
    queryKey: ['attendance-history', selectedMonth, selectedDormer],
    queryFn: async () => {
      if (!selectedMonth) return [];
      
      try {
        const summaries: MonthlyAttendanceSummary[] = [];
        const dormersToProcess = selectedDormer === "all" 
          ? (dormers || [])
          : (dormers || []).filter((d: any) => d.id === selectedDormer);
        
        for (const dormer of dormersToProcess) {
          const dormerData = dormer as any;
          // Get attendance records for this dormer and month
          const attendanceRef = collection(db, 'attendance');
          const attendanceQuery = query(
            attendanceRef,
            where("dormerId", "==", dormerData.id),
            where("month", "==", selectedMonth)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          
          const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
          const daysStayed = attendanceRecords.filter(record => record.isPresent).length;
          const notes = attendanceRecords
            .filter(record => record.note && record.note.trim())
            .map(record => record.note);
          
          // Calculate total days in the month
          const [year, monthNum] = selectedMonth.split('-');
          const totalDays = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
          
          const attendanceRate = totalDays > 0 ? Math.round((daysStayed / totalDays) * 100) : 0;
          const estimatedRentShare = Math.round((daysStayed / totalDays) * dormerData.monthlyRent);
          
          summaries.push({
            dormerId: dormerData.id,
            dormerName: dormerData.name,
            room: dormerData.room,
            month: selectedMonth,
            daysStayed,
            totalDays,
            attendanceRate,
            notes,
            monthlyRent: dormerData.monthlyRent,
            estimatedRentShare,
          });
        }
        
        return summaries.sort((a, b) => b.daysStayed - a.daysStayed);
      } catch (error) {
        console.error('Error fetching attendance history:', error);
        return [];
      }
    },
    enabled: !!selectedMonth && !!dormers,
  });

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: monthStr, label: displayName });
    }
    
    return options;
  };

  const monthOptions = getMonthOptions();
  const currentMonthDisplay = monthOptions.find(opt => opt.value === selectedMonth)?.label || selectedMonth;

  // Calculate summary statistics
  const totalDormers = monthlyAttendance?.length || 0;
  const avgAttendanceRate = totalDormers > 0 
    ? Math.round(monthlyAttendance!.reduce((sum, d) => sum + d.attendanceRate, 0) / totalDormers)
    : 0;
  const totalDaysStayed = monthlyAttendance?.reduce((sum, d) => sum + d.daysStayed, 0) || 0;
  const totalRentCollected = monthlyAttendance?.reduce((sum, d) => sum + d.estimatedRentShare, 0) || 0;

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAttendanceBadgeVariant = (rate: number): "default" | "secondary" | "destructive" | "outline" => {
    if (rate >= 80) return "default";
    if (rate >= 60) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="mt-2 text-muted-foreground">Loading attendance history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls and Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Attendance History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Dormer</label>
                <Select value={selectedDormer} onValueChange={setSelectedDormer}>
                  <SelectTrigger data-testid="select-dormer">
                    <SelectValue placeholder="Select dormer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dormers</SelectItem>
                    {dormers?.map((dormer: any) => (
                      <SelectItem key={dormer.id} value={dormer.id}>
                        {dormer.name} (Room {dormer.room})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalDormers}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Dormers</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{avgAttendanceRate}%</div>
                <div className="text-sm text-green-600 dark:text-green-400">Avg Attendance</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalDaysStayed}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Total Days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">₱{totalRentCollected.toLocaleString()}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Est. Rent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{currentMonthDisplay} Attendance Details</span>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyAttendance && monthlyAttendance.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dormer</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-center">Days Stayed</TableHead>
                    <TableHead className="text-center">Attendance Rate</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="text-right">Est. Rent Share</TableHead>
                    <TableHead className="text-center">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyAttendance.map((summary) => (
                    <TableRow key={summary.dormerId}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-primary" />
                          <span className="font-medium">{summary.dormerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{summary.room}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-sm">
                          {summary.daysStayed} / {summary.totalDays}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getAttendanceBadgeVariant(summary.attendanceRate)}>
                          {summary.attendanceRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-full max-w-20 mx-auto">
                          <Progress 
                            value={summary.attendanceRate} 
                            className="h-2" 
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          ₱{summary.estimatedRentShare.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {summary.notes.length > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {summary.notes.length} note{summary.notes.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Notes Section */}
              {monthlyAttendance.some(s => s.notes.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Notes Summary</span>
                  </h3>
                  <div className="space-y-3">
                    {monthlyAttendance
                      .filter(s => s.notes.length > 0)
                      .map(summary => (
                        <Card key={summary.dormerId} className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{summary.dormerName}</span>
                              <Badge variant="outline">Room {summary.room}</Badge>
                            </div>
                            <ul className="space-y-1">
                              {summary.notes.map((note, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  • {note}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Attendance Data</h3>
              <p className="text-muted-foreground">
                No attendance records found for {currentMonthDisplay}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
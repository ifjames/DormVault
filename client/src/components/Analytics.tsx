import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, Zap, Calendar, BarChart3, PieChart } from "lucide-react";
import { dormersService, paymentsService } from "@/lib/firestoreService";

export default function Analytics() {
  const { data: dormers } = useQuery({
    queryKey: ["dormers"],
    queryFn: dormersService.getAll,
  });

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: paymentsService.getAll,
  });

  const isLoading = !dormers || !payments;

  // Calculate analytics
  const analytics = {
    activeDormers: dormers?.filter((d: any) => d.isActive).length || 0,
    monthlyRevenue: payments?.filter((p: any) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return p.month === currentMonth && p.status === 'paid';
    }).reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0,
    pendingPayments: payments?.filter((p: any) => p.status === 'pending').length || 0,
    avgElectricBill: 0, // Will calculate from bills later
    totalDormers: dormers?.length || 0,
    occupancyRate: dormers?.length ? Math.round(((dormers?.filter((d: any) => d.isActive).length || 0) / dormers.length) * 100) : 0,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate stay durations for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const stayDurations = dormers?.slice(0, 5).map((dormer: any) => {
    // Get payments for this dormer in current month to estimate days stayed
    const dormerPayments = payments?.filter((p: any) => 
      p.dormerId === dormer.id && p.month === currentMonth
    ) || [];
    
    // Estimate based on payment amount vs monthly rent
    const daysStayed = dormerPayments.length > 0 
      ? Math.round((parseFloat((dormerPayments[0] as any).amount) / parseFloat((dormer as any).monthlyRent)) * 30)
      : 30; // Default to full month if active

    return {
      dormerName: dormer.name,
      room: dormer.room,
      days: daysStayed,
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1" data-testid="analytics-total-dormers">
              {analytics?.totalDormers || 0}
            </h3>
            <p className="text-blue-100 text-sm">Total Current Dormers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1" data-testid="analytics-monthly-rent">
              ₱{analytics?.monthlyRevenue?.toLocaleString() || "0"}
            </h3>
            <p className="text-green-100 text-sm">Collected Rent This Month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1" data-testid="analytics-avg-electric-bill">
              ₱{analytics?.avgElectricBill || 0}
            </h3>
            <p className="text-orange-100 text-sm">Avg Electric Bill/Person</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1" data-testid="analytics-avg-stay-days">
              {Math.round(stayDurations.reduce((sum: number, d: any) => sum + d.days, 0) / Math.max(stayDurations.length, 1))}
            </h3>
            <p className="text-cyan-100 text-sm">Avg Days Stayed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monthly Revenue Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Revenue trend chart will be displayed here</p>
              <small>Implementation: Use Chart.js or Recharts library</small>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Occupancy Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Occupancy Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-primary mb-2" data-testid="analytics-occupancy-rate">
                {analytics?.occupancyRate || 0}%
              </div>
              <p className="text-muted-foreground mb-4">Current Occupancy</p>
              <Progress value={analytics?.occupancyRate || 0} className="mb-2" />
              <small className="text-muted-foreground">
                {analytics?.activeDormers || 0} of {analytics?.totalDormers || 0} rooms occupied
              </small>
            </CardContent>
          </Card>

          {/* Stay Duration Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Stay Duration Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stayDurations.map((duration: any, index: number) => (
                <div key={index} className="flex justify-between items-center" data-testid={`duration-${index}`}>
                  <div>
                    <div className="font-medium">{duration.dormerName}</div>
                    <small className="text-muted-foreground">Room {duration.room}</small>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{duration.days} days</div>
                    <small className="text-muted-foreground">This month</small>
                  </div>
                </div>
              ))}
              
              {stayDurations.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No stay data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

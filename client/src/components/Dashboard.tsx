import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, AlertTriangle, Zap, Clock, CheckCircle, UserPlus, Download, Calculator, CreditCard, BarChart3 } from "lucide-react";
import { dormersService, billsService, paymentsService } from "@/lib/firestoreService";

export default function Dashboard() {
  const { data: dormers } = useQuery({
    queryKey: ["dormers"],
    queryFn: dormersService.getAll,
  });

  const { data: bills } = useQuery({
    queryKey: ["bills"],
    queryFn: billsService.getAll,
  });

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: paymentsService.getAll,
  });

  const isLoading = !dormers || !bills || !payments;

  // Calculate analytics
  const analytics = {
    activeDormers: dormers?.filter((d: any) => d.isActive).length || 0,
    monthlyRevenue: payments?.filter((p: any) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return p.month === currentMonth && p.status === 'paid';
    }).reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0,
    pendingPayments: payments?.filter((p: any) => p.status === 'pending').length || 0,
    avgElectricBill: bills && bills.length > 0 ? parseFloat((bills[0] as any).totalAmount) / (parseFloat((bills[0] as any).totalConsumption) || 1) : 0,
    totalDormers: dormers?.length || 0,
    occupancyRate: dormers?.length ? Math.round(((dormers?.filter((d: any) => d.isActive).length || 0) / dormers.length) * 100) : 0,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const recentActivities = [
    ...(bills?.slice(0, 2).map((bill: any) => {
      // Handle Firestore timestamp conversion
      let timeString = "Just now";
      try {
        if (bill.createdAt) {
          // Check if it's a Firestore timestamp object
          if (bill.createdAt.toDate && typeof bill.createdAt.toDate === 'function') {
            timeString = bill.createdAt.toDate().toLocaleString();
          } else if (bill.createdAt.seconds) {
            // Handle Firestore timestamp format
            timeString = new Date(bill.createdAt.seconds * 1000).toLocaleString();
          } else {
            // Try parsing as regular date
            timeString = new Date(bill.createdAt).toLocaleString();
          }
        }
      } catch (error) {
        console.warn('Error parsing bill date:', error);
        timeString = "Recently";
      }

      return {
        type: "bill",
        icon: Zap,
        title: "Electricity bill calculated",
        description: `Bill for period ${bill.startDate} - ${bill.endDate} (₱${parseFloat(bill.totalAmount).toLocaleString()})`,
        time: timeString,
        color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
      };
    }) || []),
    ...(payments?.slice(0, 3).map((payment: any) => {
      // Handle Firestore timestamp conversion
      let timeString = "Just now";
      try {
        if (payment.createdAt) {
          // Check if it's a Firestore timestamp object
          if (payment.createdAt.toDate && typeof payment.createdAt.toDate === 'function') {
            timeString = payment.createdAt.toDate().toLocaleString();
          } else if (payment.createdAt.seconds) {
            // Handle Firestore timestamp format
            timeString = new Date(payment.createdAt.seconds * 1000).toLocaleString();
          } else {
            // Try parsing as regular date
            timeString = new Date(payment.createdAt).toLocaleString();
          }
        }
      } catch (error) {
        console.warn('Error parsing payment date:', error);
        timeString = "Recently";
      }

      return {
        type: "payment",
        icon: CheckCircle,
        title: "Payment received",
        description: `Payment of ₱${parseFloat(payment.amount).toLocaleString()} for ${payment.month}`,
        time: timeString,
        color: "text-green-600 bg-green-50 dark:bg-green-950",
      };
    }) || []),
  ].slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Dormers</p>
                <p className="text-3xl font-bold" data-testid="stat-active-dormers">
                  {analytics?.activeDormers || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold" data-testid="stat-monthly-revenue">
                  ₱{analytics?.monthlyRevenue?.toLocaleString() || "0"}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Pending Payments</p>
                <p className="text-3xl font-bold" data-testid="stat-pending-payments">
                  {analytics?.pendingPayments || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium">Avg. Electric Bill</p>
                <p className="text-3xl font-bold" data-testid="stat-avg-electric-bill">
                  ₱{analytics?.avgElectricBill || 0}
                </p>
              </div>
              <Zap className="h-8 w-8 text-cyan-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3" data-testid={`activity-${index}`}>
                  <div className={`p-2 rounded-full ${activity.color}`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-muted-foreground text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" data-testid="button-quick-calculator">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate New Bill
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="button-quick-payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="button-quick-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="button-export-data">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

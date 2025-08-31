import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

interface Bill {
  id: string;
  billId: string;
  dormerId: string;
  daysStayed: number;
  shareAmount: string;
  month: string;
  status: "pending" | "paid" | "overdue";
  paymentDate?: string;
  description?: string;
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

export default function DormerBills() {
  const [session, setSession] = useState<DormerSession | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      if (parsedSession.user?.role === 'dormer') {
        setSession(parsedSession);
      }
    }
  }, []);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', session?.dormer?.id],
    queryFn: async () => {
      const response = await fetch(`/api/payments/dormer/${session?.dormer?.id}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    enabled: !!session?.dormer?.id,
  });

  const { data: billShares, isLoading: billSharesLoading } = useQuery({
    queryKey: ['bill-shares', session?.dormer?.id],
    queryFn: async () => {
      // We'll need to fetch bill shares for this dormer
      const response = await fetch(`/api/bills`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      const bills = await response.json();
      
      // Get shares for each bill
      const allShares = [];
      for (const bill of bills) {
        const sharesResponse = await fetch(`/api/bills/${bill.id}/shares`);
        if (sharesResponse.ok) {
          const shares = await sharesResponse.json();
          const dormerShares = shares.filter((share: any) => share.dormerId === session?.dormer?.id);
          allShares.push(...dormerShares.map((share: any) => ({ ...share, bill })));
        }
      }
      return allShares;
    },
    enabled: !!session?.dormer?.id,
  });

  if (!session) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">Please log in to view bills</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || billSharesLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="mt-2 text-muted-foreground">Loading bills...</div>
        </CardContent>
      </Card>
    );
  }

  // Combine bill shares with payments to determine status
  const bills = billShares?.map((share: any) => {
    const payment = payments?.find((p: any) => 
      p.month === share.bill.startDate?.slice(0, 7) && p.status === 'paid'
    );
    
    return {
      id: share.id,
      title: `Electricity Bill - ${new Date(share.bill.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      amount: parseFloat(share.shareAmount),
      dueDate: share.bill.endDate,
      status: payment ? 'paid' : 'pending',
      description: `Your share: ${share.daysStayed} days stayed`,
      billInfo: share.bill
    };
  }) || [];

  // Add rent payments
  const rentPayments = payments?.filter((p: any) => p.status === 'paid').map((payment: any) => ({
    id: `rent-${payment.id}`,
    title: `Rent - ${new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    amount: parseFloat(payment.amount),
    dueDate: payment.paymentDate,
    status: payment.status,
    description: 'Monthly room rent payment',
    paymentInfo: payment
  })) || [];

  const allBills = [...bills, ...rentPayments];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const totalPending = allBills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = allBills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">Pending Bills</div>
                <div className="text-2xl font-bold text-yellow-600">₱{totalPending.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Overdue Bills</div>
                <div className="text-2xl font-bold text-red-600">₱{totalOverdue.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">This Month</div>
                <div className="text-2xl font-bold text-green-600">
                  {allBills.filter(b => b.status === "paid").length} Paid
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>My Bills</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bills found</p>
              </div>
            ) : (
              allBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(bill.status)}
                  <div>
                    <div className="font-medium">{bill.title}</div>
                    <div className="text-sm text-muted-foreground">{bill.description}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">₱{bill.amount.toFixed(2)}</div>
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {bill.status === "pending" && (
                    <Button size="sm" data-testid={`pay-bill-${bill.id}`}>
                      Pay Now
                    </Button>
                  )}
                  
                  {bill.status === "overdue" && (
                    <Button size="sm" variant="destructive" data-testid={`pay-overdue-${bill.id}`}>
                      Pay Overdue
                    </Button>
                  )}
                  
                  {bill.status === "paid" && (
                    <Button size="sm" variant="outline" disabled>
                      Paid
                    </Button>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
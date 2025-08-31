import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  description: string;
}

export default function DormerBills() {
  // Mock bills data - in real app this would come from Firebase
  const bills: Bill[] = [
    {
      id: "1",
      title: "Electricity Bill - December 2024",
      amount: 450.75,
      dueDate: "2024-12-31",
      status: "pending",
      description: "Monthly electricity consumption for your room"
    },
    {
      id: "2", 
      title: "Rent - December 2024",
      amount: 1500,
      dueDate: "2024-12-05",
      status: "paid",
      description: "Monthly room rent payment"
    },
    {
      id: "3",
      title: "Water Bill - December 2024", 
      amount: 125.50,
      dueDate: "2024-12-15",
      status: "pending",
      description: "Monthly water consumption charges"
    },
    {
      id: "4",
      title: "Internet Bill - November 2024",
      amount: 200,
      dueDate: "2024-11-30",
      status: "overdue",
      description: "Shared internet connection fee"
    }
  ];

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

  const totalPending = bills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = bills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0);

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
                  {bills.filter(b => b.status === "paid").length} Paid
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
            {bills.map((bill) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
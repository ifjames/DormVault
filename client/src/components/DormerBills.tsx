import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { db, COLLECTIONS } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, Phone, User } from "lucide-react";
import gcashQR from "@/assets/gcash-qr.png";

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  description: string;
  type: "electricity" | "rent" | "water" | "internet";
}

interface DormerData {
  id: string;
  name: string;
  room: string;
  email: string;
  monthlyRent: string;
  role: string;
}

export default function DormerBills() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const [dormerData, setDormerData] = useState<DormerData | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Fetch dormer data when user is authenticated
  useEffect(() => {
    if (user?.email) {
      const fetchDormerData = async () => {
        try {
          const dormersRef = collection(db, COLLECTIONS.DORMERS);
          const q = query(dormersRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const dormerDoc = querySnapshot.docs[0];
            setDormerData({ id: dormerDoc.id, ...dormerDoc.data() } as DormerData);
          }
        } catch (error) {
          console.error("Error fetching dormer data:", error);
        }
      };
      
      fetchDormerData();
    }
  }, [user]);

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills', dormerData?.id],
    queryFn: async () => {
      if (!dormerData?.id) return [];
      
      const billsData: Bill[] = [];
      
      // Fetch bill shares for electricity bills
      const billSharesRef = collection(db, COLLECTIONS.BILL_SHARES);
      const billSharesQuery = query(billSharesRef, where("dormerId", "==", dormerData.id));
      const billSharesSnapshot = await getDocs(billSharesQuery);
      
      for (const shareDoc of billSharesSnapshot.docs) {
        try {
          const shareData = shareDoc.data();
          
          // Get the associated bill using doc() instead of query
          const billDocRef = doc(db, COLLECTIONS.BILLS, shareData.billId);
          const billDocSnap = await getDoc(billDocRef);
          
          if (!billDocSnap.exists()) {
            continue; // Skip this iteration if bill doesn't exist
          }
          
          if (billDocSnap.exists()) {
            const billData = billDocSnap.data();
          
          // Check if this bill share has been paid
          const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
          const paymentsQuery = query(
            paymentsRef, 
            where("dormerId", "==", dormerData.id),
            where("billShareId", "==", shareDoc.id)
          );
          const paymentsSnapshot = await getDocs(paymentsQuery);
          
          const isPaid = !paymentsSnapshot.empty;
          
          // Handle both string and timestamp date formats
          const startDate = typeof billData.startDate === 'string' ? new Date(billData.startDate) : new Date(billData.startDate.toDate());
          const endDate = typeof billData.endDate === 'string' ? new Date(billData.endDate) : new Date(billData.endDate.toDate());
          const isOverdue = new Date() > endDate;
          
          billsData.push({
            id: shareDoc.id,
            title: `Electricity Bill - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            amount: parseFloat(shareData.shareAmount),
            dueDate: endDate.toISOString().split('T')[0],
            status: isPaid ? "paid" : (isOverdue ? "overdue" : "pending"),
            description: `Your share: ${shareData.daysStayed} days stayed`,
            type: "electricity" as const
          });
        }
        } catch (error) {
          console.error("Error processing bill share:", shareDoc.id, error);
        }
      }
      
      // Fetch rent payments as bills
      const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
      const paymentsQuery = query(paymentsRef, where("dormerId", "==", dormerData.id));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      paymentsSnapshot.docs.forEach(paymentDoc => {
        const paymentData = paymentDoc.data();
        // Only show rent payments, skip bill payments
        if (!paymentData.billShareId) {
          billsData.push({
            id: paymentDoc.id,
            title: `Rent - ${paymentData.month}`,
            amount: parseFloat(paymentData.amount),
            dueDate: paymentData.paymentDate.toDate().toISOString().split('T')[0],
            status: paymentData.status || "paid",
            description: "Monthly room rent payment",
            type: "rent" as const
          });
        }
      });
      
      return billsData.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    },
    enabled: !!dormerData?.id,
  });

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
          <div className="text-muted-foreground">Please log in to view bills</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="mt-2 text-muted-foreground">Loading bills...</div>
        </CardContent>
      </Card>
    );
  }

  const allBills = bills || [];

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

  const handlePayOverdue = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentModalOpen(true);
  };

  const handlePaymentComplete = () => {
    setPaymentModalOpen(false);
    setSelectedBill(null);
    // Here you could add logic to mark the bill as paid or send a notification
  };

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
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  {getStatusIcon(bill.status)}
                  <div className="min-w-0 flex-1">
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
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="font-bold text-lg">₱{bill.amount.toFixed(2)}</div>
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {bill.status === "pending" && (
                    <Button size="sm" data-testid={`pay-bill-${bill.id}`} className="w-full sm:w-auto">
                      Pay Now
                    </Button>
                  )}
                  
                  {bill.status === "overdue" && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      data-testid={`pay-overdue-${bill.id}`} 
                      className="w-full sm:w-auto"
                      onClick={() => handlePayOverdue(bill)}
                    >
                      Pay Overdue
                    </Button>
                  )}
                  
                  {bill.status === "paid" && (
                    <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
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

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="w-[90vw] max-w-sm max-h-[85vh] overflow-y-auto p-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-center text-lg">Pay Bill via GCash</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Complete your payment using GCash
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-3">
              {/* Bill Details */}
              <div className="text-center p-2 bg-muted rounded-lg">
                <div className="font-semibold text-sm">{selectedBill.title}</div>
                <div className="text-lg font-bold text-destructive">₱{selectedBill.amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{selectedBill.description}</div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
                  <img 
                    src={gcashQR} 
                    alt="GCash QR Code" 
                    className="w-40 sm:w-48 h-auto mx-auto"
                  />
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-xs">JAMES RAPHAEL CASTILLO</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-xs">09276681520</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center text-xs text-muted-foreground">
                <p>Scan the QR code or send to the mobile number above.</p>
                <p>Click "Complete" after making the payment.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button 
                  variant="outline" 
                  className="flex-1 text-sm py-2"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 text-sm py-2"
                  onClick={handlePaymentComplete}
                >
                  Complete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
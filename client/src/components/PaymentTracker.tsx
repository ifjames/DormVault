import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CreditCard, Plus, Eye, Edit, Check, Clock, AlertTriangle } from "lucide-react";
import type { Dormer, Payment } from "@shared/schema";

const paymentSchema = z.object({
  dormerId: z.string().min(1),
  month: z.string().min(1),
  amount: z.number().min(0),
  paymentDate: z.string(),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(["paid", "pending", "overdue"]).default("paid"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function PaymentTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: dormers } = useQuery({
    queryKey: ["/api/dormers"],
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      dormerId: "",
      month: new Date().toISOString().slice(0, 7),
      amount: 1500,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "",
      notes: "",
      status: "paid",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiRequest("PUT", `/api/payments/${paymentId}`, { status: "paid" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment marked as paid",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentForm) => {
    createPaymentMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDormerName = (dormerId: string) => {
    const dormer = dormers?.find((d: Dormer) => d.id === dormerId);
    return dormer ? `${dormer.name} - Room ${dormer.room}` : "Unknown";
  };

  const paidCount = payments?.filter((p: Payment) => p.status === "paid").length || 0;
  const pendingCount = payments?.filter((p: Payment) => p.status === "pending").length || 0;
  const totalExpected = (dormers?.length || 0) * 1500;
  const totalCollected = payments?.filter((p: Payment) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Tracker</span>
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-record-payment">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Dormer</Label>
                  <Select 
                    value={form.watch("dormerId")} 
                    onValueChange={(value) => form.setValue("dormerId", value)}
                  >
                    <SelectTrigger data-testid="select-dormer">
                      <SelectValue placeholder="Choose a dormer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dormers?.map((dormer: Dormer) => (
                        <SelectItem key={dormer.id} value={dormer.id}>
                          {dormer.name} - Room {dormer.room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Input
                      id="month"
                      type="month"
                      {...form.register("month")}
                      data-testid="input-payment-month"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₱)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...form.register("amount", { valueAsNumber: true })}
                      data-testid="input-payment-amount"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    {...form.register("paymentDate")}
                    data-testid="input-payment-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select 
                    value={form.watch("paymentMethod")} 
                    onValueChange={(value) => form.setValue("paymentMethod", value)}
                  >
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder="Select method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Additional notes..."
                    data-testid="input-payment-notes"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-payment"
                  >
                    {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dormer</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment: Payment) => (
                  <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                    <TableCell className="font-medium">
                      {getDormerName(payment.dormerId)}
                    </TableCell>
                    <TableCell>{payment.month}</TableCell>
                    <TableCell>₱{parseFloat(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {payment.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsPaidMutation.mutate(payment.id)}
                            disabled={markAsPaidMutation.isPending}
                            data-testid={`button-mark-paid-${payment.id}`}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" data-testid={`button-view-payment-${payment.id}`}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-edit-payment-${payment.id}`}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div className="p-3 border rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600" data-testid="stat-paid-count">{paidCount}</div>
                <small className="text-muted-foreground">Paid</small>
              </div>
              <div className="p-3 border rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-count">{pendingCount}</div>
                <small className="text-muted-foreground">Pending</small>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Expected:</span>
                <span className="font-medium" data-testid="stat-total-expected">₱{totalExpected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Collected:</span>
                <span className="font-medium text-green-600" data-testid="stat-total-collected">₱{totalCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding:</span>
                <span className="font-medium text-yellow-600" data-testid="stat-outstanding">₱{(totalExpected - totalCollected).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Upcoming Due Dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dormers?.slice(0, 3).map((dormer: Dormer) => (
              <div key={dormer.id} className="flex justify-between items-center mb-3 last:mb-0">
                <div>
                  <div className="font-medium">{dormer.name}</div>
                  <small className="text-muted-foreground">Room {dormer.room}</small>
                </div>
                <div className="text-right">
                  <div className="font-medium text-yellow-600">₱{parseFloat(dormer.monthlyRent).toLocaleString()}</div>
                  <small className="text-muted-foreground">Due soon</small>
                </div>
              </div>
            ))}
            
            <Button className="w-full mt-4" variant="outline" size="sm" data-testid="button-send-reminders">
              Send Reminders
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

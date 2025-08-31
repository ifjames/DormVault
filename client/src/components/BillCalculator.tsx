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
import { useToast } from "@/hooks/use-toast";
import { Calculator, Plus, Trash2, CheckCircle, Eye, Calendar, Zap } from "lucide-react";
import { dormersService, billsService } from "@/lib/firestoreService";

const billCalculatorSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  previousReading: z.number().min(0),
  currentReading: z.number().min(0),
  ratePerKwh: z.number().min(0),
  people: z.array(z.object({
    name: z.string().min(1),
    days: z.number().min(1),
  })).min(1),
});

type BillCalculatorForm = z.infer<typeof billCalculatorSchema>;

export default function BillCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [people, setPeople] = useState([{ name: "", days: 1 }]);
  const [billResult, setBillResult] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: dormers } = useQuery({
    queryKey: ["dormers"],
    queryFn: dormersService.getAll,
  });

  const { data: recentBills } = useQuery({
    queryKey: ["bills"],
    queryFn: billsService.getAll,
  });

  const form = useForm<BillCalculatorForm>({
    resolver: zodResolver(billCalculatorSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      previousReading: 0,
      currentReading: 0,
      ratePerKwh: 13.71,
      people: people,
    },
  });

  const saveBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const bill = await billsService.create(data.bill);
      const sharePromises = data.shares.map((share: any) => 
        billsService.createShare({ ...share, billId: bill.id })
      );
      await Promise.all(sharePromises);
      return bill;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bill calculation saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save bill calculation",
        variant: "destructive",
      });
    },
  });

  const addPerson = () => {
    setPeople([...people, { name: "", days: 1 }]);
  };

  const removePerson = (index: number) => {
    if (people.length > 1) {
      const newPeople = people.filter((_, i) => i !== index);
      setPeople(newPeople);
      form.setValue("people", newPeople);
    }
  };

  const updatePerson = (index: number, field: "name" | "days", value: string | number) => {
    const newPeople = [...people];
    newPeople[index] = { ...newPeople[index], [field]: value };
    setPeople(newPeople);
    form.setValue("people", newPeople);
  };

  const onSubmit = (data: BillCalculatorForm) => {
    const consumption = data.currentReading - data.previousReading;
    const totalBill = consumption * data.ratePerKwh;
    const totalDays = data.people.reduce((sum, person) => sum + person.days, 0);

    const individualShares = data.people.map(person => ({
      name: person.name,
      days: person.days,
      amount: (totalBill * person.days / totalDays),
    }));

    const result = {
      ...data,
      consumption,
      totalBill,
      individualShares,
    };

    setBillResult(result);
  };

  const saveBill = () => {
    if (!billResult) return;

    const billData = {
      startDate: billResult.startDate,
      endDate: billResult.endDate,
      previousReading: billResult.previousReading.toString(),
      currentReading: billResult.currentReading.toString(),
      ratePerKwh: billResult.ratePerKwh.toString(),
      totalConsumption: billResult.consumption.toString(),
      totalAmount: billResult.totalBill.toString(),
    };

    const shares = billResult.individualShares.map((share: any) => ({
      dormerId: dormers?.find((d: any) => d.name === share.name)?.id || "",
      daysStayed: share.days,
      shareAmount: share.amount.toString(),
    }));

    saveBillMutation.mutate({ bill: billData, shares });
  };

  const viewBillDetails = async (bill: any) => {
    try {
      // Fetch bill shares for this bill
      const shares = await billsService.getShares(bill.id);
      const billWithShares = { ...bill, shares };
      setSelectedBill(billWithShares);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bill details",
        variant: "destructive",
      });
    }
  };

  const formatBillMonth = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start.getMonth() === end.getMonth()) {
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return `${startMonth} - ${endMonth}`;
      }
    } catch (error) {
      return "Unknown Period";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Meralco Bill Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register("endDate")}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* Meter Readings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="previousReading">Previous Reading (kWh)</Label>
                <Input
                  id="previousReading"
                  type="number"
                  step="0.01"
                  {...form.register("previousReading", { valueAsNumber: true })}
                  data-testid="input-previous-reading"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentReading">Current Reading (kWh)</Label>
                <Input
                  id="currentReading"
                  type="number"
                  step="0.01"
                  {...form.register("currentReading", { valueAsNumber: true })}
                  data-testid="input-current-reading"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ratePerKwh">Rate per kWh (₱)</Label>
                <Input
                  id="ratePerKwh"
                  type="number"
                  step="0.01"
                  {...form.register("ratePerKwh", { valueAsNumber: true })}
                  data-testid="input-rate-per-kwh"
                />
              </div>
            </div>

            {/* People Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">People Staying</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPerson}
                  data-testid="button-add-person"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </div>

              {people.map((person, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div className="md:col-span-3 space-y-2">
                        <Label>Person Name</Label>
                        <Input
                          value={person.name}
                          onChange={(e) => updatePerson(index, "name", e.target.value)}
                          placeholder="Enter name"
                          data-testid={`input-person-name-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Days Stayed</Label>
                        <Input
                          type="number"
                          min="1"
                          value={person.days}
                          onChange={(e) => updatePerson(index, "days", parseInt(e.target.value) || 1)}
                          data-testid={`input-person-days-${index}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePerson(index)}
                        disabled={people.length === 1}
                        data-testid={`button-remove-person-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-lg"
              data-testid="button-calculate-bill"
            >
              <Calculator className="h-5 w-5 mr-2" />
              Calculate Bill
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bill Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Bill Calculation Result</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billResult ? (
            <div className="space-y-4" data-testid="bill-result">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border">
                <div className="mb-3">
                  <strong>Period:</strong> {billResult.startDate} - {billResult.endDate}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <small className="text-muted-foreground">Previous Reading</small>
                    <div className="font-medium">{billResult.previousReading.toLocaleString()} kWh</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Current Reading</small>
                    <div className="font-medium">{billResult.currentReading.toLocaleString()} kWh</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <small className="text-muted-foreground">Consumption</small>
                    <div className="font-medium text-primary">{billResult.consumption.toLocaleString()} kWh</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Rate</small>
                    <div className="font-medium">₱{billResult.ratePerKwh}/kWh</div>
                  </div>
                </div>

                <hr className="my-3" />

                <h6 className="font-medium mb-3">Individual Shares:</h6>
                <div className="space-y-2">
                  {billResult.individualShares.map((share: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{share.name}</span>
                        <small className="text-muted-foreground ml-2">({share.days} days)</small>
                      </div>
                      <div className="font-bold text-green-600">₱{share.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <hr className="my-3" />

                <div className="flex justify-between items-center">
                  <strong>Total Bill:</strong>
                  <strong className="text-primary text-xl">₱{billResult.totalBill.toFixed(2)}</strong>
                </div>

                <Button 
                  onClick={saveBill}
                  className="w-full mt-4"
                  disabled={saveBillMutation.isPending}
                  data-testid="button-save-calculation"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {saveBillMutation.isPending ? "Saving..." : "Save Calculation"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Fill in the form and click "Calculate Bill" to see the results here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bills Section */}
      <Card className="lg:col-span-3 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Bills</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBills && recentBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBills.slice(0, 6).map((bill: any) => (
                <Card key={bill.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{formatBillMonth(bill.startDate, bill.endDate)}</h4>
                        <p className="text-xs text-muted-foreground">
                          {bill.startDate} to {bill.endDate}
                        </p>
                      </div>
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Consumption:</span>
                        <span className="font-medium">{parseFloat(bill.totalConsumption).toFixed(1)} kWh</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Amount:</span>
                        <span className="font-bold text-green-600">₱{parseFloat(bill.totalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => viewBillDetails(bill)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No bills calculated yet</p>
              <p className="text-sm">Calculate your first electricity bill above to see it here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Bill Details - {selectedBill && formatBillMonth(selectedBill.startDate, selectedBill.endDate)}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">Bill Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <small className="text-muted-foreground">Period</small>
                    <div className="font-medium">{selectedBill.startDate} - {selectedBill.endDate}</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Rate per kWh</small>
                    <div className="font-medium">₱{parseFloat(selectedBill.ratePerKwh).toFixed(2)}</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Previous Reading</small>
                    <div className="font-medium">{parseFloat(selectedBill.previousReading).toLocaleString()} kWh</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Current Reading</small>
                    <div className="font-medium">{parseFloat(selectedBill.currentReading).toLocaleString()} kWh</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Total Consumption</small>
                    <div className="font-medium text-primary">{parseFloat(selectedBill.totalConsumption).toLocaleString()} kWh</div>
                  </div>
                  <div>
                    <small className="text-muted-foreground">Total Amount</small>
                    <div className="font-bold text-green-600 text-lg">₱{parseFloat(selectedBill.totalAmount).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Individual Shares */}
              {selectedBill.shares && selectedBill.shares.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Individual Shares</h3>
                  <div className="space-y-3">
                    {selectedBill.shares.map((share: any, index: number) => {
                      const dormer = dormers?.find((d: any) => d.id === share.dormerId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">{(dormer as any)?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              Room {(dormer as any)?.room} • {share.daysStayed} days
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">₱{parseFloat(share.shareAmount).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {((parseFloat(share.shareAmount) / parseFloat(selectedBill.totalAmount)) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

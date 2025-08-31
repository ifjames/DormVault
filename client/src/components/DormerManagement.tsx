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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Eye, Edit, Trash2, UserCheck, UserX, Calendar } from "lucide-react";
import { dormersService } from "@/lib/firestoreService";

const dormerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required").optional(),
  room: z.string().min(1, "Room number is required"),
  monthlyRent: z.number().min(0, "Rent must be positive").default(1500),
  isActive: z.boolean().default(true),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
});

type DormerForm = z.infer<typeof dormerSchema>;

export default function DormerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDormer, setEditingDormer] = useState<any>(null);

  const { data: dormers, isLoading } = useQuery({
    queryKey: ["dormers"],
    queryFn: dormersService.getAll,
  });

  const form = useForm<DormerForm>({
    resolver: zodResolver(dormerSchema),
    defaultValues: {
      name: "",
      email: "",
      room: "",
      monthlyRent: 1500,
      isActive: true,
      checkInDate: new Date().toISOString().slice(0, 10),
      checkOutDate: "",
    },
  });

  const createDormerMutation = useMutation({
    mutationFn: dormersService.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dormer added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["dormers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add dormer",
        variant: "destructive",
      });
    },
  });

  const updateDormerMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => dormersService.update(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dormer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["dormers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setEditingDormer(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update dormer",
        variant: "destructive",
      });
    },
  });

  const deleteDormerMutation = useMutation({
    mutationFn: dormersService.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dormer removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["dormers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove dormer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DormerForm) => {
    if (editingDormer) {
      updateDormerMutation.mutate({ id: editingDormer.id, ...data });
    } else {
      createDormerMutation.mutate(data);
    }
  };

  const startEdit = (dormer: any) => {
    setEditingDormer(dormer);
    form.reset({
      name: dormer.name,
      email: dormer.email || "",
      room: dormer.room,
      monthlyRent: parseFloat(dormer.monthlyRent) || 1500,
      isActive: dormer.isActive,
      checkInDate: dormer.checkInDate || "",
      checkOutDate: dormer.checkOutDate || "",
    });
    setIsAddDialogOpen(true);
  };

  const calculateDaysStayed = (dormer: any) => {
    if (!dormer.checkInDate) return 0;
    
    const checkIn = new Date(dormer.checkInDate);
    const checkOut = dormer.checkOutDate ? new Date(dormer.checkOutDate) : new Date();
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeDormers = dormers?.filter((d: any) => d.isActive) || [];
  const inactiveDormers = dormers?.filter((d: any) => !d.isActive) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Dormer Management</span>
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingDormer(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-dormer">
                <Plus className="h-4 w-4 mr-2" />
                Add Dormer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDormer ? "Edit Dormer" : "Add New Dormer"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      data-testid="input-dormer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room Number</Label>
                    <Input
                      id="room"
                      {...form.register("room")}
                      data-testid="input-dormer-room"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    data-testid="input-dormer-email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRent">Monthly Rent (₱)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      step="0.01"
                      {...form.register("monthlyRent", { valueAsNumber: true })}
                      data-testid="input-dormer-rent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={form.watch("isActive") ? "active" : "inactive"} 
                      onValueChange={(value) => form.setValue("isActive", value === "active")}
                    >
                      <SelectTrigger data-testid="select-dormer-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Check-in Date</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      {...form.register("checkInDate")}
                      data-testid="input-dormer-checkin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Check-out Date (Optional)</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      {...form.register("checkOutDate")}
                      data-testid="input-dormer-checkout"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingDormer(null);
                      form.reset();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDormerMutation.isPending || updateDormerMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-dormer"
                  >
                    {(createDormerMutation.isPending || updateDormerMutation.isPending) 
                      ? "Saving..." 
                      : editingDormer ? "Update Dormer" : "Add Dormer"}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Days Stayed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dormers?.map((dormer: any) => (
                  <TableRow key={dormer.id} data-testid={`dormer-row-${dormer.id}`}>
                    <TableCell className="font-medium">{dormer.name}</TableCell>
                    <TableCell>{dormer.room}</TableCell>
                    <TableCell>₱{parseFloat(dormer.monthlyRent || 1500).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{calculateDaysStayed(dormer)} days</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dormer.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(dormer)}
                          data-testid={`button-edit-dormer-${dormer.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDormerMutation.mutate(dormer.id)}
                          disabled={deleteDormerMutation.isPending}
                          data-testid={`button-delete-dormer-${dormer.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Summary Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Dormers Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-center mb-4">
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600" data-testid="stat-active-dormers">
                  {activeDormers.length}
                </div>
                <small className="text-muted-foreground">Active Dormers</small>
              </div>
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-950">
                <UserX className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-600" data-testid="stat-inactive-dormers">
                  {inactiveDormers.length}
                </div>
                <small className="text-muted-foreground">Inactive Dormers</small>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Capacity:</span>
                <span className="font-medium" data-testid="stat-total-capacity">{dormers?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Occupancy Rate:</span>
                <span className="font-medium text-blue-600" data-testid="stat-occupancy-rate">
                  {dormers?.length ? Math.round((activeDormers.length / dormers.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expected Monthly Revenue:</span>
                <span className="font-medium text-green-600" data-testid="stat-expected-revenue">
                  ₱{activeDormers.reduce((sum: number, d: any) => sum + parseFloat(d.monthlyRent || 1500), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Check-ins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeDormers.slice(0, 3).map((dormer: any) => (
              <div key={dormer.id} className="flex justify-between items-center mb-3 last:mb-0">
                <div>
                  <div className="font-medium">{dormer.name}</div>
                  <small className="text-muted-foreground">Room {dormer.room}</small>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-600">{calculateDaysStayed(dormer)} days</div>
                  <small className="text-muted-foreground">
                    {dormer.checkInDate ? new Date(dormer.checkInDate).toLocaleDateString() : "No date"}
                  </small>
                </div>
              </div>
            ))}
            
            {activeDormers.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active dormers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
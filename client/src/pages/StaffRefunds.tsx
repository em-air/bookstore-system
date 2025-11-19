import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Refund } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffRefunds() {
  const { toast } = useToast();

  const { data: refunds, isLoading } = useQuery<Refund[]>({
    queryKey: ["/api/staff/refunds"],
  });

  const updateRefundMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/staff/refunds/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/refunds"] });
      toast({
        title: "Refund updated",
        description: "Refund status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "denied":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Refund Management</h2>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Refund ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refunds && refunds.length > 0 ? (
              refunds.map((refund) => (
                <TableRow key={refund.id} data-testid={`row-refund-${refund.id}`}>
                  <TableCell className="font-medium">#{refund.id}</TableCell>
                  <TableCell data-testid={`text-order-${refund.id}`}>
                    Order #{refund.orderId}
                  </TableCell>
                  <TableCell data-testid={`text-customer-${refund.id}`}>
                    User #{refund.userId}
                  </TableCell>
                  <TableCell>
                    {format(new Date(refund.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" data-testid={`text-reason-${refund.id}`}>
                    {refund.reason}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(refund.status)} data-testid={`badge-status-${refund.id}`}>
                      {refund.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {refund.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateRefundMutation.mutate({
                              id: refund.id,
                              status: "approved",
                            })
                          }
                          disabled={updateRefundMutation.isPending}
                          data-testid={`button-approve-${refund.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateRefundMutation.mutate({
                              id: refund.id,
                              status: "denied",
                            })
                          }
                          disabled={updateRefundMutation.isPending}
                          data-testid={`button-deny-${refund.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No refund requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OrderWithItems, Refund } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Orders() {
  const { toast } = useToast();
  const [refundReason, setRefundReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const { data: refunds } = useQuery<Refund[]>({
    queryKey: ["/api/refunds"],
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully",
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

  const requestRefundMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest("POST", "/api/refunds", {
        orderId,
        reason: refundReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      setRefundReason("");
      setSelectedOrderId(null);
      toast({
        title: "Refund requested",
        description: "Your refund request has been submitted",
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

  const getOrderRefund = (orderId: number) => {
    return refunds?.find((r) => r.orderId === orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <div className="space-y-6">
          {orders.map((order) => {
            const refund = getOrderRefund(order.id);
            
            return (
              <Card key={order.id} className="p-6" data-testid={`card-order-${order.id}`}>
                <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold" data-testid={`text-order-id-${order.id}`}>
                        Order #{order.id}
                      </h3>
                      <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold" data-testid={`text-total-${order.id}`}>
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex gap-4" data-testid={`item-${item.id}`}>
                      <div className="w-16 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {item.book.coverImage ? (
                          <img
                            src={item.book.coverImage}
                            alt={item.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium font-serif" data-testid={`text-item-title-${item.id}`}>
                          {item.book.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          by {item.book.author}
                        </p>
                        <p className="text-sm mt-1">
                          Quantity: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {order.status === "pending" && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => cancelOrderMutation.mutate(order.id)}
                      disabled={cancelOrderMutation.isPending}
                      data-testid={`button-cancel-order-${order.id}`}
                    >
                      {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  )}

                  {refund ? (
                    <div className="border-t pt-4 w-full">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Refund Status:</span>
                        <Badge 
                          variant={refund.status === "approved" ? "default" : refund.status === "denied" ? "destructive" : "secondary"}
                          data-testid={`badge-refund-status-${order.id}`}
                        >
                          {refund.status}
                        </Badge>
                      </div>
                      {refund.reason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Reason: {refund.reason}
                        </p>
                      )}
                    </div>
                  ) : order.status === "completed" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                          data-testid={`button-request-refund-${order.id}`}
                        >
                          Request Refund
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Refund</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for the refund request
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                              id="reason"
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              placeholder="Please explain why you'd like a refund..."
                              className="min-h-[100px]"
                              data-testid="input-refund-reason"
                            />
                          </div>
                          <Button
                            onClick={() => requestRefundMutation.mutate(order.id)}
                            disabled={refundReason.length < 10 || requestRefundMutation.isPending}
                            className="w-full"
                            data-testid="button-submit-refund"
                          >
                            {requestRefundMutation.isPending ? "Submitting..." : "Submit Request"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

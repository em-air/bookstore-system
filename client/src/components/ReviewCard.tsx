import { ReviewWithUser } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface ReviewCardProps {
  review: ReviewWithUser;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initials = review.user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-4" data-testid={`card-review-${review.id}`}>
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium" data-testid={`text-reviewer-${review.id}`}>
                {review.user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "fill-primary text-primary"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          
          {review.comment && (
            <p className="text-sm" data-testid={`text-comment-${review.id}`}>
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

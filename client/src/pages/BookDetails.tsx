import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { BookWithReviews } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, ShoppingCart, ArrowLeft } from "lucide-react";
import { ReviewCard } from "@/components/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function BookDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: book, isLoading } = useQuery<BookWithReviews>({
    queryKey: ["/api/books", id],
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", { bookId: Number(id), quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Book has been added to your cart",
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

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reviews", {
        bookId: Number(id),
        rating: reviewRating,
        comment: reviewComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", id] });
      setReviewComment("");
      setReviewRating(5);
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-[40%_60%] gap-12">
            <Skeleton className="aspect-[2/3] w-full" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground text-lg">Book not found</p>
          <Button onClick={() => setLocation("/")} className="mt-4" data-testid="button-back">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const avgRating = book.reviews.length > 0
    ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>

        <div className="grid md:grid-cols-[40%_60%] gap-12">
          <div>
            <div className="aspect-[2/3] bg-muted rounded-md overflow-hidden sticky top-24">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <p className="text-muted-foreground">No Cover Image</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold font-serif mb-4" data-testid="text-title">
                {book.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-2" data-testid="text-author">
                by {book.author}
              </p>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="secondary" data-testid="text-category">{book.category}</Badge>
                {book.isbn && (
                  <span className="text-sm text-muted-foreground">ISBN: {book.isbn}</span>
                )}
                {book.publishedYear && (
                  <span className="text-sm text-muted-foreground">Published: {book.publishedYear}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(avgRating)
                          ? "fill-primary text-primary"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {avgRating.toFixed(1)} ({book.reviews.length} reviews)
                </span>
              </div>

              {book.description && (
                <p className="text-muted-foreground leading-relaxed mb-6" data-testid="text-description">
                  {book.description}
                </p>
              )}

              <div className="flex items-center gap-6 mb-6">
                <div>
                  <p className="text-4xl font-bold" data-testid="text-price">
                    ${parseFloat(book.price).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium" data-testid="text-stock">
                    {book.stock > 0 ? `${book.stock} available` : "Out of stock"}
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => addToCartMutation.mutate()}
                disabled={book.stock === 0 || addToCartMutation.isPending || !isAuthenticated}
                className="w-full md:w-auto"
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {book.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please login to add items to cart
                </p>
              )}
            </div>

            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
              
              {isAuthenticated && (
                <Card className="p-6 mb-6">
                  <h3 className="font-semibold mb-4">Write a Review</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="flex gap-2 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i + 1)}
                            className="focus:outline-none"
                            data-testid={`button-rating-${i + 1}`}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                i < reviewRating
                                  ? "fill-primary text-primary"
                                  : "text-muted"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="comment">Comment</Label>
                      <Textarea
                        id="comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts about this book..."
                        data-testid="input-review-comment"
                      />
                    </div>

                    <Button
                      onClick={() => submitReviewMutation.mutate()}
                      disabled={submitReviewMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      Submit Review
                    </Button>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {book.reviews.length > 0 ? (
                  book.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No reviews yet. Be the first to review this book!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

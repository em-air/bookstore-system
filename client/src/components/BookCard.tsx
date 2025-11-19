import { Link } from "wouter";
import { Book } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: Book;
  onAddToCart?: (bookId: number) => void;
  isAddingToCart?: boolean;
}

export function BookCard({ book, onAddToCart, isAddingToCart }: BookCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(book.id);
    }
  };

  return (
    <Link href={`/books/${book.id}`}>
      <Card 
        className="hover-elevate cursor-pointer overflow-hidden h-full flex flex-col"
        data-testid={`card-book-${book.id}`}
      >
        <div className="aspect-[2/3] bg-muted relative overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <p className="text-muted-foreground text-sm px-4 text-center">No Cover</p>
            </div>
          )}
          {book.stock === 0 && (
            <Badge className="absolute top-2 right-2 bg-destructive" data-testid={`badge-out-of-stock-${book.id}`}>
              Out of Stock
            </Badge>
          )}
        </div>
        
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-serif text-xl font-semibold line-clamp-2" data-testid={`text-title-${book.id}`}>
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-author-${book.id}`}>
            by {book.author}
          </p>
          <p className="text-xs text-muted-foreground" data-testid={`text-category-${book.id}`}>
            {book.category}
          </p>
          
          <div className="flex items-center gap-1 mt-auto">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <Star className="h-4 w-4 fill-primary text-primary" />
            <Star className="h-4 w-4 fill-primary text-primary" />
            <Star className="h-4 w-4 fill-primary text-primary" />
            <Star className="h-4 w-4 text-muted" />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="text-2xl font-bold" data-testid={`text-price-${book.id}`}>
              ${parseFloat(book.price).toFixed(2)}
            </p>
            {onAddToCart && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={book.stock === 0 || isAddingToCart}
                data-testid={`button-add-to-cart-${book.id}`}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

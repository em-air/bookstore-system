import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Book } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (bookId: number) => {
      return apiRequest("POST", "/api/cart", { bookId, quantity: 1 });
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

  const filteredBooks = books?.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = books 
    ? Array.from(new Set(books.map((b) => b.category)))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} />
      
      <div className="relative h-[50vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-amber-950"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/30" />
        </div>
        
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="max-w-3xl text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white font-serif">
              Discover Your Next Great Read
            </h1>
            <p className="text-xl text-white/90">
              Browse thousands of books across all genres
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <h2 className="text-2xl font-semibold">Browse Books</h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("")}
              data-testid="button-category-all"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredBooks && filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={isAuthenticated ? addToCartMutation.mutate : undefined}
                isAddingToCart={addToCartMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No books found</p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(""); setSelectedCategory(""); }}
              className="mt-4"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

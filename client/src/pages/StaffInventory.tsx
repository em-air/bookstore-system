import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Book, InsertBook } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffInventory() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Partial<InsertBook>>({
    title: "",
    author: "",
    category: "",
    description: "",
    price: "0",
    stock: 0,
    coverImage: "",
    isbn: "",
    publishedYear: undefined,
  });

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const addBookMutation = useMutation({
    mutationFn: async (data: InsertBook) => {
      return apiRequest("POST", "/api/staff/books", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Book added",
        description: "The book has been added successfully",
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

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBook> }) => {
      return apiRequest("PATCH", `/api/staff/books/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setEditingBook(null);
      resetForm();
      toast({
        title: "Book updated",
        description: "The book has been updated successfully",
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

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/staff/books/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book deleted",
        description: "The book has been deleted successfully",
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

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      category: "",
      description: "",
      price: "0",
      stock: 0,
      coverImage: "",
      isbn: "",
      publishedYear: undefined,
    });
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description || "",
      price: book.price,
      stock: book.stock,
      coverImage: book.coverImage || "",
      isbn: book.isbn || "",
      publishedYear: book.publishedYear || undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: InsertBook = {
      title: formData.title!,
      author: formData.author!,
      category: formData.category!,
      description: formData.description,
      price: formData.price!,
      stock: Number(formData.stock),
      coverImage: formData.coverImage || null,
      isbn: formData.isbn || null,
      publishedYear: formData.publishedYear ? Number(formData.publishedYear) : null,
    };

    if (editingBook) {
      updateBookMutation.mutate({ id: editingBook.id, data });
    } else {
      addBookMutation.mutate(data);
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-book">
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    data-testid="input-author"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    data-testid="input-category"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    data-testid="input-price"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    data-testid="input-stock"
                  />
                </div>
                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    data-testid="input-isbn"
                  />
                </div>
                <div>
                  <Label htmlFor="publishedYear">Published Year</Label>
                  <Input
                    id="publishedYear"
                    type="number"
                    value={formData.publishedYear || ""}
                    onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value ? Number(e.target.value) : undefined })}
                    data-testid="input-published-year"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    data-testid="input-cover-image"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="input-description"
                  />
                </div>
              </div>
              <Button type="submit" disabled={addBookMutation.isPending} data-testid="button-submit">
                {addBookMutation.isPending ? "Adding..." : "Add Book"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books && books.length > 0 ? (
              books.map((book) => (
                <TableRow key={book.id} data-testid={`row-book-${book.id}`}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.category}</TableCell>
                  <TableCell>${parseFloat(book.price).toFixed(2)}</TableCell>
                  <TableCell>{book.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={editingBook?.id === book.id} onOpenChange={(open) => !open && setEditingBook(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(book)}
                            data-testid={`button-edit-${book.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Book</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <Label htmlFor="edit-title">Title *</Label>
                                <Input
                                  id="edit-title"
                                  required
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                  data-testid="input-edit-title"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-author">Author *</Label>
                                <Input
                                  id="edit-author"
                                  required
                                  value={formData.author}
                                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                  data-testid="input-edit-author"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-category">Category *</Label>
                                <Input
                                  id="edit-category"
                                  required
                                  value={formData.category}
                                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                  data-testid="input-edit-category"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-price">Price *</Label>
                                <Input
                                  id="edit-price"
                                  type="number"
                                  step="0.01"
                                  required
                                  value={formData.price}
                                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                  data-testid="input-edit-price"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-stock">Stock *</Label>
                                <Input
                                  id="edit-stock"
                                  type="number"
                                  required
                                  value={formData.stock}
                                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                  data-testid="input-edit-stock"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-isbn">ISBN</Label>
                                <Input
                                  id="edit-isbn"
                                  value={formData.isbn}
                                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                  data-testid="input-edit-isbn"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-publishedYear">Published Year</Label>
                                <Input
                                  id="edit-publishedYear"
                                  type="number"
                                  value={formData.publishedYear || ""}
                                  onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value ? Number(e.target.value) : undefined })}
                                  data-testid="input-edit-published-year"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="edit-coverImage">Cover Image URL</Label>
                                <Input
                                  id="edit-coverImage"
                                  value={formData.coverImage}
                                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                  data-testid="input-edit-cover-image"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  data-testid="input-edit-description"
                                />
                              </div>
                            </div>
                            <Button type="submit" disabled={updateBookMutation.isPending} data-testid="button-submit-edit">
                              {updateBookMutation.isPending ? "Updating..." : "Update Book"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this book?")) {
                            deleteBookMutation.mutate(book.id);
                          }
                        }}
                        data-testid={`button-delete-${book.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No books in inventory
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

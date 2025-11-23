import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertBookSchema, insertReviewSchema, insertRefundSchema, insertCardSchema } from "../shared/schema.js";
import { z } from "zod";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== "staff" && req.userRole !== "admin") {
    return res.status(403).json({ message: "Staff access required" });
  }
  next();
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export function registerRoutes(app: Express): void {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) return res.status(400).json({ message: "Email already registered" });

      const role = data.role || "customer";
      if (!["customer", "staff", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        role: role as "customer" | "staff" | "admin",
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error: any) {
      console.error('Failed to fetch books:', error.message);
      res.status(500).json({ message: "Failed to fetch books", error: error.message });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBookWithReviews(parseInt(req.params.id));
      if (!book) return res.status(404).json({ message: "Book not found" });
      res.json(book);
    } catch {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.get("/api/cart", authenticate, async (req: AuthRequest, res) => {
    try {
      const items = await storage.getCartItems(req.userId!);
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", authenticate, async (req: AuthRequest, res) => {
    try {
      const { bookId, quantity } = req.body;
      if (!bookId || !quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ message: "Book not found" });
      if (book.stock < quantity) return res.status(400).json({ message: "Insufficient stock" });

      const item = await storage.addToCart({ userId: req.userId!, bookId, quantity });
      res.json(item);
    } catch {
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity < 1) return res.status(400).json({ message: "Invalid quantity" });

      const item = await storage.updateCartItem(parseInt(req.params.id), quantity);
      if (!item) return res.status(404).json({ message: "Cart item not found" });
      res.json(item);
    } catch {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.removeFromCart(parseInt(req.params.id));
      res.json({ message: "Item removed" });
    } catch {
      res.status(500).json({ message: "Failed to remove item" });
    }
  });

  app.get("/api/cards", authenticate, async (req: AuthRequest, res) => {
    try {
      const userCards = await storage.getUserCards(req.userId!);
      res.json(userCards);
    } catch {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post("/api/cards", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = insertCardSchema.parse({ ...req.body, userId: req.userId });
      const card = await storage.createCard(data);
      res.json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.delete("/api/cards/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteCard(parseInt(req.params.id));
      res.json({ message: "Card deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  app.get("/api/orders", authenticate, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getUserOrders(req.userId!);
      res.json(orders);
    } catch {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", authenticate, async (req: AuthRequest, res) => {
    try {
      const { cardId } = req.body;
      const cartItems = await storage.getCartItems(req.userId!);
      if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

      for (const item of cartItems) {
        if (item.book.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.book.title}` });
        }
      }

      const order = await storage.createOrder(req.userId!, cartItems, cardId);
      res.json(order);
    } catch {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post("/api/reviews", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = insertReviewSchema.parse({ ...req.body, userId: req.userId });
      const hasPurchased = await storage.hasUserPurchasedBook(req.userId!, data.bookId);
      if (!hasPurchased) {
        return res.status(403).json({ message: "You can only review books you have purchased" });
      }

      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/refunds", authenticate, async (req: AuthRequest, res) => {
    try {
      const refunds = await storage.getUserRefunds(req.userId!);
      res.json(refunds);
    } catch {
      res.status(500).json({ message: "Failed to fetch refunds" });
    }
  });

  app.post("/api/refunds", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = insertRefundSchema.parse({ ...req.body, userId: req.userId });
      const order = await storage.getOrder(data.orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.userId !== req.userId) return res.status(403).json({ message: "Not your order" });
      if (order.status !== "completed") {
        return res.status(400).json({ message: "Can only refund completed orders" });
      }

      const refund = await storage.createRefund(data);
      res.json(refund);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create refund" });
    }
  });

  app.post("/api/staff/books", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const data = insertBookSchema.parse(req.body);
      const book = await storage.createBook(data);
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Staff list books (same data as public, but guarded for symmetry if needed)
  app.get("/api/staff/books", authenticate, requireStaff, async (_req: AuthRequest, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Staff get single book
  app.get("/api/staff/books/:id", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const book = await storage.getBook(parseInt(req.params.id));
      if (!book) return res.status(404).json({ message: "Book not found" });
      res.json(book);
    } catch {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.patch("/api/staff/books/:id", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const book = await storage.updateBook(parseInt(req.params.id), req.body);
      if (!book) return res.status(404).json({ message: "Book not found" });
      res.json(book);
    } catch {
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/staff/books/:id", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      await storage.deleteBook(parseInt(req.params.id));
      res.json({ message: "Book deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  app.get("/api/staff/orders", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/staff/orders/:id", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "processing", "completed", "cancelled", "shipped"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.get("/api/staff/refunds", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const refunds = await storage.getAllRefunds();
      res.json(refunds);
    } catch {
      res.status(500).json({ message: "Failed to fetch refunds" });
    }
  });

  app.patch("/api/staff/refunds/:id", authenticate, requireStaff, async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!["approved", "denied"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const refund = await storage.updateRefundStatus(parseInt(req.params.id), status);
      if (!refund) return res.status(404).json({ message: "Refund not found" });
      res.json(refund);
    } catch {
      res.status(500).json({ message: "Failed to update refund" });
    }
  });
}

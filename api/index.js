import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  books: () => books,
  booksRelations: () => booksRelations,
  cards: () => cards,
  cardsRelations: () => cardsRelations,
  cartItems: () => cartItems,
  cartItemsRelations: () => cartItemsRelations,
  insertBookSchema: () => insertBookSchema,
  insertCardSchema: () => insertCardSchema,
  insertCartItemSchema: () => insertCartItemSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertRefundSchema: () => insertRefundSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertShoppingCartItemSchema: () => insertShoppingCartItemSchema,
  insertShoppingCartSchema: () => insertShoppingCartSchema,
  insertStoreInventorySchema: () => insertStoreInventorySchema,
  insertUserSchema: () => insertUserSchema,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orderStatusEnum: () => orderStatusEnum,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  refundStatusEnum: () => refundStatusEnum,
  refunds: () => refunds,
  refundsRelations: () => refundsRelations,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  roleEnum: () => roleEnum,
  shoppingCartItems: () => shoppingCartItems,
  shoppingCartItemsRelations: () => shoppingCartItemsRelations,
  shoppingCarts: () => shoppingCarts,
  shoppingCartsRelations: () => shoppingCartsRelations,
  storeInventory: () => storeInventory,
  storeInventoryRelations: () => storeInventoryRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("role", ["customer", "staff", "admin"]);
var orderStatusEnum = pgEnum("order_status", ["pending", "processing", "completed", "cancelled", "shipped"]);
var refundStatusEnum = pgEnum("refund_status", ["pending", "approved", "denied"]);
var users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstname: varchar("firstname", { length: 255 }),
  lastname: varchar("lastname", { length: 255 }),
  role: roleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ many, one }) => ({
  cartItems: many(cartItems),
  shoppingCart: one(shoppingCarts, {
    fields: [users.id],
    references: [shoppingCarts.userId]
  }),
  orders: many(orders),
  reviews: many(reviews),
  refunds: many(refunds),
  cards: many(cards)
}));
var books = pgTable("books", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  coverImage: text("cover_image"),
  isbn: varchar("isbn", { length: 20 }),
  publishedYear: integer("published_year"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var booksRelations = relations(books, ({ many, one }) => ({
  shoppingCartItems: many(shoppingCartItems),
  orderItems: many(orderItems),
  reviews: many(reviews),
  storeInventory: one(storeInventory, {
    fields: [books.id],
    references: [storeInventory.bookId]
  })
}));
var shoppingCarts = pgTable("shopping_carts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var shoppingCartsRelations = relations(shoppingCarts, ({ one, many }) => ({
  user: one(users, {
    fields: [shoppingCarts.userId],
    references: [users.id]
  }),
  items: many(shoppingCartItems)
}));
var shoppingCartItems = pgTable("shopping_cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cartId: integer("cart_id").notNull().references(() => shoppingCarts.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var shoppingCartItemsRelations = relations(shoppingCartItems, ({ one }) => ({
  shoppingCart: one(shoppingCarts, {
    fields: [shoppingCartItems.cartId],
    references: [shoppingCarts.id]
  }),
  book: one(books, {
    fields: [shoppingCartItems.bookId],
    references: [books.id]
  })
}));
var cartItems = pgTable("cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id]
  }),
  book: one(books, {
    fields: [cartItems.bookId],
    references: [books.id]
  })
}));
var orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").references(() => cards.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  card: one(cards, {
    fields: [orders.cardId],
    references: [cards.id]
  }),
  orderItems: many(orderItems),
  refunds: many(refunds)
}));
var orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  book: one(books, {
    fields: [orderItems.bookId],
    references: [books.id]
  })
}));
var reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  }),
  book: one(books, {
    fields: [reviews.bookId],
    references: [books.id]
  })
}));
var cards = pgTable("cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardNum: varchar("card_num", { length: 16 }).notNull(),
  expireDate: varchar("expire_date", { length: 7 }).notNull(),
  // MM/YYYY format
  cvc: varchar("cvc", { length: 4 }).notNull(),
  firstname: varchar("firstname", { length: 255 }).notNull(),
  lastname: varchar("lastname", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var cardsRelations = relations(cards, ({ one, many }) => ({
  user: one(users, {
    fields: [cards.userId],
    references: [users.id]
  }),
  orders: many(orders)
}));
var storeInventory = pgTable("store_inventory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().unique().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var storeInventoryRelations = relations(storeInventory, ({ one }) => ({
  book: one(books, {
    fields: [storeInventory.bookId],
    references: [books.id]
  })
}));
var refunds = pgTable("refunds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var refundsRelations = relations(refunds, ({ one }) => ({
  user: one(users, {
    fields: [refunds.userId],
    references: [users.id]
  }),
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id]
  })
}));
var insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstname: z.string().optional(),
  lastname: z.string().optional()
}).omit({
  id: true,
  createdAt: true
});
var insertCardSchema = createInsertSchema(cards, {
  cardNum: z.string().length(16, "Card number must be 16 digits"),
  expireDate: z.string().regex(/^\d{2}\/\d{4}$/, "Expire date must be MM/YYYY format"),
  cvc: z.string().min(3).max(4, "CVC must be 3-4 digits"),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required")
}).omit({
  id: true,
  createdAt: true
});
var insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true
});
var insertShoppingCartSchema = createInsertSchema(shoppingCarts).omit({
  id: true,
  createdAt: true
});
var insertShoppingCartItemSchema = createInsertSchema(shoppingCartItems, {
  quantity: z.number().int().positive()
}).omit({
  id: true,
  createdAt: true
});
var insertStoreInventorySchema = createInsertSchema(storeInventory, {
  quantity: z.number().int().min(0, "Quantity cannot be negative")
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCartItemSchema = createInsertSchema(cartItems, {
  quantity: z.number().int().positive()
}).omit({
  id: true,
  createdAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true
});
var insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().int().min(1).max(5)
}).omit({
  id: true,
  createdAt: true
});
var insertRefundSchema = createInsertSchema(refunds, {
  reason: z.string().min(10, "Reason must be at least 10 characters")
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllBooks() {
    return await db.select().from(books).orderBy(desc(books.createdAt));
  }
  async getBook(id) {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || void 0;
  }
  async getBookWithReviews(id) {
    const book = await this.getBook(id);
    if (!book) return void 0;
    const bookReviews = await db.select({
      id: reviews.id,
      userId: reviews.userId,
      bookId: reviews.bookId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email
      }
    }).from(reviews).innerJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.bookId, id)).orderBy(desc(reviews.createdAt));
    return {
      ...book,
      reviews: bookReviews.map((r) => ({
        ...r,
        user: r.user
      }))
    };
  }
  async createBook(book) {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }
  async updateBook(id, book) {
    const [updated] = await db.update(books).set(book).where(eq(books.id, id)).returning();
    return updated || void 0;
  }
  async deleteBook(id) {
    await db.delete(books).where(eq(books.id, id));
  }
  async getCartItems(userId) {
    const items = await db.select({
      id: cartItems.id,
      userId: cartItems.userId,
      bookId: cartItems.bookId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      book: books
    }).from(cartItems).innerJoin(books, eq(cartItems.bookId, books.id)).where(eq(cartItems.userId, userId)).orderBy(desc(cartItems.createdAt));
    return items.map((item) => ({
      ...item,
      book: item.book
    }));
  }
  async addToCart(item) {
    const existing = await db.select().from(cartItems).where(
      and(
        eq(cartItems.userId, item.userId),
        eq(cartItems.bookId, item.bookId)
      )
    );
    if (existing.length > 0) {
      const [updated] = await db.update(cartItems).set({ quantity: existing[0].quantity + item.quantity }).where(eq(cartItems.id, existing[0].id)).returning();
      return updated;
    }
    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }
  async updateCartItem(id, quantity) {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated || void 0;
  }
  async removeFromCart(id) {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }
  async clearCart(userId) {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }
  async getUserOrders(userId) {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          bookId: orderItems.bookId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          book: books
        }).from(orderItems).innerJoin(books, eq(orderItems.bookId, books.id)).where(eq(orderItems.orderId, order.id));
        return {
          ...order,
          orderItems: items.map((item) => ({
            ...item,
            book: item.book
          }))
        };
      })
    );
    return ordersWithItems;
  }
  async getAllOrders() {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          bookId: orderItems.bookId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          book: books
        }).from(orderItems).innerJoin(books, eq(orderItems.bookId, books.id)).where(eq(orderItems.orderId, order.id));
        return {
          ...order,
          orderItems: items.map((item) => ({
            ...item,
            book: item.book
          }))
        };
      })
    );
    return ordersWithItems;
  }
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return void 0;
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      bookId: orderItems.bookId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      createdAt: orderItems.createdAt,
      book: books
    }).from(orderItems).innerJoin(books, eq(orderItems.bookId, books.id)).where(eq(orderItems.orderId, id));
    return {
      ...order,
      orderItems: items.map((item) => ({
        ...item,
        book: item.book
      }))
    };
  }
  async getUserCards(userId) {
    return await db.select().from(cards).where(eq(cards.userId, userId)).orderBy(desc(cards.createdAt));
  }
  async getCard(id) {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || void 0;
  }
  async createCard(card) {
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }
  async deleteCard(id) {
    await db.delete(cards).where(eq(cards.id, id));
  }
  async createOrder(userId, items, cardId) {
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.book.price) * item.quantity,
      0
    );
    const [order] = await db.insert(orders).values({
      userId,
      cardId,
      totalAmount: totalAmount.toFixed(2),
      status: "pending"
    }).returning();
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        bookId: item.bookId,
        quantity: item.quantity,
        price: item.book.price
      });
      await db.update(books).set({ stock: sql2`${books.stock} - ${item.quantity}` }).where(eq(books.id, item.bookId));
    }
    await this.clearCart(userId);
    return order;
  }
  async updateOrderStatus(id, status) {
    const [updated] = await db.update(orders).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, id)).returning();
    return updated || void 0;
  }
  async createReview(review) {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }
  async hasUserPurchasedBook(userId, bookId) {
    const result = await db.select({ count: sql2`count(*)::int` }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.bookId, bookId),
        eq(orders.status, "completed")
      )
    );
    return result[0]?.count > 0;
  }
  async createRefund(refund) {
    const [newRefund] = await db.insert(refunds).values(refund).returning();
    return newRefund;
  }
  async getUserRefunds(userId) {
    return await db.select().from(refunds).where(eq(refunds.userId, userId)).orderBy(desc(refunds.createdAt));
  }
  async getAllRefunds() {
    return await db.select().from(refunds).orderBy(desc(refunds.createdAt));
  }
  async updateRefundStatus(id, status) {
    const refund = await this.getRefund(id);
    if (!refund) return void 0;
    if (status === "approved") {
      const order = await this.getOrder(refund.orderId);
      if (order) {
        for (const item of order.orderItems) {
          await db.update(books).set({ stock: sql2`${books.stock} + ${item.quantity}` }).where(eq(books.id, item.bookId));
        }
      }
    }
    const [updated] = await db.update(refunds).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(refunds.id, id)).returning();
    return updated || void 0;
  }
  async getRefund(id) {
    const [refund] = await db.select().from(refunds).where(eq(refunds.id, id));
    return refund || void 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z as z2 } from "zod";
var JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";
var authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
var requireStaff = (req, res, next) => {
  if (req.userRole !== "staff" && req.userRole !== "admin") {
    return res.status(403).json({ message: "Staff access required" });
  }
  next();
};
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
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
        role
      });
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
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
  app2.get("/api/books", async (req, res) => {
    try {
      const books2 = await storage.getAllBooks();
      res.json(books2);
    } catch {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });
  app2.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBookWithReviews(parseInt(req.params.id));
      if (!book) return res.status(404).json({ message: "Book not found" });
      res.json(book);
    } catch {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });
  app2.get("/api/cart", authenticate, async (req, res) => {
    try {
      const items = await storage.getCartItems(req.userId);
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });
  app2.post("/api/cart", authenticate, async (req, res) => {
    try {
      const { bookId, quantity } = req.body;
      if (!bookId || !quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid request" });
      }
      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ message: "Book not found" });
      if (book.stock < quantity) return res.status(400).json({ message: "Insufficient stock" });
      const item = await storage.addToCart({ userId: req.userId, bookId, quantity });
      res.json(item);
    } catch {
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });
  app2.patch("/api/cart/:id", authenticate, async (req, res) => {
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
  app2.delete("/api/cart/:id", authenticate, async (req, res) => {
    try {
      await storage.removeFromCart(parseInt(req.params.id));
      res.json({ message: "Item removed" });
    } catch {
      res.status(500).json({ message: "Failed to remove item" });
    }
  });
  app2.get("/api/cards", authenticate, async (req, res) => {
    try {
      const userCards = await storage.getUserCards(req.userId);
      res.json(userCards);
    } catch {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });
  app2.post("/api/cards", authenticate, async (req, res) => {
    try {
      const data = insertCardSchema.parse({ ...req.body, userId: req.userId });
      const card = await storage.createCard(data);
      res.json(card);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  });
  app2.delete("/api/cards/:id", authenticate, async (req, res) => {
    try {
      await storage.deleteCard(parseInt(req.params.id));
      res.json({ message: "Card deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });
  app2.get("/api/orders", authenticate, async (req, res) => {
    try {
      const orders2 = await storage.getUserOrders(req.userId);
      res.json(orders2);
    } catch {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.post("/api/orders", authenticate, async (req, res) => {
    try {
      const { cardId } = req.body;
      const cartItems2 = await storage.getCartItems(req.userId);
      if (cartItems2.length === 0) return res.status(400).json({ message: "Cart is empty" });
      for (const item of cartItems2) {
        if (item.book.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.book.title}` });
        }
      }
      const order = await storage.createOrder(req.userId, cartItems2, cardId);
      res.json(order);
    } catch {
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  app2.post("/api/reviews", authenticate, async (req, res) => {
    try {
      const data = insertReviewSchema.parse({ ...req.body, userId: req.userId });
      const hasPurchased = await storage.hasUserPurchasedBook(req.userId, data.bookId);
      if (!hasPurchased) {
        return res.status(403).json({ message: "You can only review books you have purchased" });
      }
      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  app2.get("/api/refunds", authenticate, async (req, res) => {
    try {
      const refunds2 = await storage.getUserRefunds(req.userId);
      res.json(refunds2);
    } catch {
      res.status(500).json({ message: "Failed to fetch refunds" });
    }
  });
  app2.post("/api/refunds", authenticate, async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create refund" });
    }
  });
  app2.post("/api/staff/books", authenticate, requireStaff, async (req, res) => {
    try {
      const data = insertBookSchema.parse(req.body);
      const book = await storage.createBook(data);
      res.json(book);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });
  app2.patch("/api/staff/books/:id", authenticate, requireStaff, async (req, res) => {
    try {
      const book = await storage.updateBook(parseInt(req.params.id), req.body);
      if (!book) return res.status(404).json({ message: "Book not found" });
      res.json(book);
    } catch {
      res.status(500).json({ message: "Failed to update book" });
    }
  });
  app2.delete("/api/staff/books/:id", authenticate, requireStaff, async (req, res) => {
    try {
      await storage.deleteBook(parseInt(req.params.id));
      res.json({ message: "Book deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete book" });
    }
  });
  app2.get("/api/staff/orders", authenticate, requireStaff, async (req, res) => {
    try {
      const orders2 = await storage.getAllOrders();
      res.json(orders2);
    } catch {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.patch("/api/staff/orders/:id", authenticate, requireStaff, async (req, res) => {
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
  app2.get("/api/staff/refunds", authenticate, requireStaff, async (req, res) => {
    try {
      const refunds2 = await storage.getAllRefunds();
      res.json(refunds2);
    } catch {
      res.status(500).json({ message: "Failed to fetch refunds" });
    }
  });
  app2.patch("/api/staff/refunds/:id", authenticate, requireStaff, async (req, res) => {
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
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (process.env.NODE_ENV !== "production") {
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "127.0.0.1", () => {
      log(`serving on port ${port}`);
      console.log(`\u{1F680} Server running at http://localhost:${port}`);
    });
  }
})();
var index_default = app;
export {
  index_default as default
};

import { sql, relations } from "drizzle-orm";
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

export const roleEnum = pgEnum("role", ["customer", "staff", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "completed", "cancelled", "shipped"]);
export const refundStatusEnum = pgEnum("refund_status", ["pending", "approved", "denied"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstname: varchar("firstname", { length: 255 }),
  lastname: varchar("lastname", { length: 255 }),
  role: roleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  cartItems: many(cartItems),
  shoppingCart: one(shoppingCarts, {
    fields: [users.id],
    references: [shoppingCarts.userId],
  }),
  orders: many(orders),
  reviews: many(reviews),
  refunds: many(refunds),
  cards: many(cards),
}));

export const books = pgTable("books", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const booksRelations = relations(books, ({ many, one }) => ({
  shoppingCartItems: many(shoppingCartItems),
  orderItems: many(orderItems),
  reviews: many(reviews),
  storeInventory: one(storeInventory, {
    fields: [books.id],
    references: [storeInventory.bookId],
  }),
}));

// ShoppingCart table (1:1 with User)
export const shoppingCarts = pgTable("shopping_carts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shoppingCartsRelations = relations(shoppingCarts, ({ one, many }) => ({
  user: one(users, {
    fields: [shoppingCarts.userId],
    references: [users.id],
  }),
  items: many(shoppingCartItems),
}));

// ShoppingCartItem table
export const shoppingCartItems = pgTable("shopping_cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cartId: integer("cart_id").notNull().references(() => shoppingCarts.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shoppingCartItemsRelations = relations(shoppingCartItems, ({ one }) => ({
  shoppingCart: one(shoppingCarts, {
    fields: [shoppingCartItems.cartId],
    references: [shoppingCarts.id],
  }),
  book: one(books, {
    fields: [shoppingCartItems.bookId],
    references: [books.id],
  }),
}));

// Legacy cart_items table - kept for backward compatibility
export const cartItems = pgTable("cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [cartItems.bookId],
    references: [books.id],
  }),
}));

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").references(() => cards.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [orders.cardId],
    references: [cards.id],
  }),
  orderItems: many(orderItems),
  refunds: many(refunds),
}));

export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  book: one(books, {
    fields: [orderItems.bookId],
    references: [books.id],
  }),
}));

export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [reviews.bookId],
    references: [books.id],
  }),
}));

export const cards = pgTable("cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardNum: varchar("card_num", { length: 16 }).notNull(),
  expireDate: varchar("expire_date", { length: 7 }).notNull(), // MM/YYYY format
  cvc: varchar("cvc", { length: 4 }).notNull(),
  firstname: varchar("firstname", { length: 255 }).notNull(),
  lastname: varchar("lastname", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cardsRelations = relations(cards, ({ one, many }) => ({
  user: one(users, {
    fields: [cards.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));

// StoreInventory table (1:1 with Book)
export const storeInventory = pgTable("store_inventory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().unique().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const storeInventoryRelations = relations(storeInventory, ({ one }) => ({
  book: one(books, {
    fields: [storeInventory.bookId],
    references: [books.id],
  }),
}));

export const refunds = pgTable("refunds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refundsRelations = relations(refunds, ({ one }) => ({
  user: one(users, {
    fields: [refunds.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Invalid email address"),
  password: (schema) => schema.password.min(6, "Password must be at least 6 characters"),
  username: (schema) => schema.username.min(3, "Username must be at least 3 characters"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCardSchema = createInsertSchema(cards, {
  cardNum: (schema) => schema.cardNum.length(16, "Card number must be 16 digits"),
  expireDate: (schema) => schema.expireDate.regex(/^\d{2}\/\d{4}$/, "Expire date must be in MM/YYYY format"),
  cvc: (schema) => schema.cvc.min(3).max(4, "CVC must be 3-4 digits"),
  firstname: (schema) => schema.firstname.min(1, "First name is required"),
  lastname: (schema) => schema.lastname.min(1, "Last name is required"),
}).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCarts).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingCartItemSchema = createInsertSchema(shoppingCartItems, {
  quantity: (schema) => schema.quantity.int().positive(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertStoreInventorySchema = createInsertSchema(storeInventory, {
  quantity: (schema) => schema.quantity.int().min(0, "Quantity cannot be negative"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems, {
  quantity: (schema) => schema.quantity.int().positive(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: (schema) => schema.rating.int().min(1).max(5),
}).omit({
  id: true,
  createdAt: true,
});

export const insertRefundSchema = createInsertSchema(refunds, {
  reason: (schema) => schema.reason.min(10, "Reason must be at least 10 characters"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;

export type ShoppingCartItem = typeof shoppingCartItems.$inferSelect;
export type InsertShoppingCartItem = z.infer<typeof insertShoppingCartItemSchema>;

export type StoreInventory = typeof storeInventory.$inferSelect;
export type InsertStoreInventory = z.infer<typeof insertStoreInventorySchema>;

export type CartItemWithBook = CartItem & { book: Book };
export type ShoppingCartItemWithBook = ShoppingCartItem & { book: Book };
export type OrderWithItems = Order & { orderItems: (OrderItem & { book: Book })[], card?: Card };
export type ReviewWithUser = Review & { user: User };
export type BookWithReviews = Book & { reviews: ReviewWithUser[] };

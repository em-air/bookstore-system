import { 
  users, books, cartItems, orders, orderItems, reviews, refunds, cards,
  type User, type InsertUser, type Book, type InsertBook,
  type CartItem, type InsertCartItem, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Review, type InsertReview,
  type Refund, type InsertRefund, type Card, type InsertCard,
  type CartItemWithBook, type OrderWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Book methods
  getAllBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBookWithReviews(id: number): Promise<any>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<void>;

  // Cart methods
  getCartItems(userId: number): Promise<CartItemWithBook[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Card methods
  getUserCards(userId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  deleteCard(id: number): Promise<void>;

  // Order methods
  getUserOrders(userId: number): Promise<OrderWithItems[]>;
  getAllOrders(): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(userId: number, items: CartItemWithBook[], cardId?: number): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  hasUserPurchasedBook(userId: number, bookId: number): Promise<boolean>;

  // Refund methods
  createRefund(refund: InsertRefund): Promise<Refund>;
  getUserRefunds(userId: number): Promise<Refund[]>;
  getAllRefunds(): Promise<Refund[]>;
  updateRefundStatus(id: number, status: string): Promise<Refund | undefined>;
  getRefund(id: number): Promise<Refund | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books).orderBy(desc(books.createdAt));
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getBookWithReviews(id: number): Promise<any> {
    const book = await this.getBook(id);
    if (!book) return undefined;

    const bookReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        bookId: reviews.bookId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.bookId, id))
      .orderBy(desc(reviews.createdAt));

    return {
      ...book,
      reviews: bookReviews.map(r => ({
        ...r,
        user: r.user,
      })),
    };
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined> {
    const [updated] = await db
      .update(books)
      .set(book)
      .where(eq(books.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async getCartItems(userId: number): Promise<CartItemWithBook[]> {
    const items = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        bookId: cartItems.bookId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        book: books,
      })
      .from(cartItems)
      .innerJoin(books, eq(cartItems.bookId, books.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));

    return items.map(item => ({
      ...item,
      book: item.book,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, item.userId),
          eq(cartItems.bookId, item.bookId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + item.quantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated || undefined;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async getUserOrders(userId: number): Promise<OrderWithItems[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            bookId: orderItems.bookId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            createdAt: orderItems.createdAt,
            book: books,
          })
          .from(orderItems)
          .innerJoin(books, eq(orderItems.bookId, books.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items.map(item => ({
            ...item,
            book: item.book,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            bookId: orderItems.bookId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            createdAt: orderItems.createdAt,
            book: books,
          })
          .from(orderItems)
          .innerJoin(books, eq(orderItems.bookId, books.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items.map(item => ({
            ...item,
            book: item.book,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        bookId: orderItems.bookId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        createdAt: orderItems.createdAt,
        book: books,
      })
      .from(orderItems)
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      orderItems: items.map(item => ({
        ...item,
        book: item.book,
      })),
    };
  }

  async getUserCards(userId: number): Promise<Card[]> {
    return await db
      .select()
      .from(cards)
      .where(eq(cards.userId, userId))
      .orderBy(desc(cards.createdAt));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }

  async deleteCard(id: number): Promise<void> {
    await db.delete(cards).where(eq(cards.id, id));
  }

  async createOrder(userId: number, items: CartItemWithBook[], cardId?: number): Promise<Order> {
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.book.price) * item.quantity,
      0
    );

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        cardId,
        totalAmount: totalAmount.toFixed(2),
        status: "pending",
      })
      .returning();

    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        bookId: item.bookId,
        quantity: item.quantity,
        price: item.book.price,
      });

      await db
        .update(books)
        .set({ stock: sql`${books.stock} - ${item.quantity}` })
        .where(eq(books.id, item.bookId));
    }

    await this.clearCart(userId);

    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async hasUserPurchasedBook(userId: number, bookId: number): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.bookId, bookId),
          eq(orders.status, "completed")
        )
      );

    return result[0]?.count > 0;
  }

  async createRefund(refund: InsertRefund): Promise<Refund> {
    const [newRefund] = await db.insert(refunds).values(refund).returning();
    return newRefund;
  }

  async getUserRefunds(userId: number): Promise<Refund[]> {
    return await db
      .select()
      .from(refunds)
      .where(eq(refunds.userId, userId))
      .orderBy(desc(refunds.createdAt));
  }

  async getAllRefunds(): Promise<Refund[]> {
    return await db.select().from(refunds).orderBy(desc(refunds.createdAt));
  }

  async updateRefundStatus(id: number, status: string): Promise<Refund | undefined> {
    const refund = await this.getRefund(id);
    if (!refund) return undefined;

    if (status === "approved") {
      const order = await this.getOrder(refund.orderId);
      if (order) {
        for (const item of order.orderItems) {
          await db
            .update(books)
            .set({ stock: sql`${books.stock} + ${item.quantity}` })
            .where(eq(books.id, item.bookId));
        }
      }
    }

    const [updated] = await db
      .update(refunds)
      .set({ status, updatedAt: new Date() })
      .where(eq(refunds.id, id))
      .returning();
    return updated || undefined;
  }

  async getRefund(id: number): Promise<Refund | undefined> {
    const [refund] = await db.select().from(refunds).where(eq(refunds.id, id));
    return refund || undefined;
  }
}

export const storage = new DatabaseStorage();

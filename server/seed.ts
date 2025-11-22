import "dotenv/config";
import { db } from "./db";
import { users, books, reviews, refunds, orders, orderItems, cartItems, shoppingCartItems, shoppingCarts, storeInventory, cards } from "../shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data in correct order (respecting foreign keys)
    console.log("Clearing existing data...");
    await db.delete(refunds);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(reviews);
    await db.delete(cartItems);
    await db.delete(shoppingCartItems);
    await db.delete(shoppingCarts);
    await db.delete(storeInventory);
    await db.delete(cards);
    await db.delete(books);
    await db.delete(users);
    
    console.log("Resetting sequences...");
    await db.execute(sql`ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE IF EXISTS books_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1`);
    
    // Create users
    console.log("Creating users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    await db.insert(users).values([
      {
        username: "Admin User",
        email: "admin@bookhaven.com",
        password: hashedPassword,
        firstname: "Admin",
        lastname: "User",
        role: "admin",
      },
      {
        username: "Staff Member",
        email: "staff@bookhaven.com",
        password: hashedPassword,
        firstname: "Staff",
        lastname: "Member",
        role: "staff",
      },
      {
        username: "John Customer",
        email: "customer@example.com",
        password: hashedPassword,
        firstname: "John",
        lastname: "Customer",
        role: "customer",
      },
    ]);

    console.log("Creating books...");
    await db.insert(books).values([
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        category: "Fiction",
        description: "A gripping tale of racial injustice and childhood innocence in the American South.",
        price: "14.99",
        stock: 25,
        isbn: "9780061120084",
        publishedYear: 1960,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
      },
      {
        title: "1984",
        author: "George Orwell",
        category: "Science Fiction",
        description: "A dystopian social science fiction novel and cautionary tale about totalitarianism.",
        price: "13.99",
        stock: 30,
        isbn: "9780451524935",
        publishedYear: 1949,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        category: "Romance",
        description: "A romantic novel of manners set in Georgian England.",
        price: "12.99",
        stock: 20,
        isbn: "9780141439518",
        publishedYear: 1813,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        category: "Fiction",
        description: "A classic American novel set in the Jazz Age that explores themes of decadence and excess.",
        price: "15.99",
        stock: 18,
        isbn: "9780743273565",
        publishedYear: 1925,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        category: "Fantasy",
        description: "A fantasy novel about the adventures of hobbit Bilbo Baggins.",
        price: "16.99",
        stock: 22,
        isbn: "9780547928227",
        publishedYear: 1937,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
      },
      {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        category: "Fantasy",
        description: "The first novel in the Harry Potter series following a young wizard's journey.",
        price: "18.99",
        stock: 35,
        isbn: "9780439708180",
        publishedYear: 1997,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg",
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        category: "Fiction",
        description: "A story about teenage rebellion and alienation.",
        price: "14.99",
        stock: 15,
        isbn: "9780316769488",
        publishedYear: 1951,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg",
      },
      {
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        category: "Fantasy",
        description: "An epic high-fantasy novel following the quest to destroy the One Ring.",
        price: "29.99",
        stock: 12,
        isbn: "9780544003415",
        publishedYear: 1954,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780544003415-L.jpg",
      },
      {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        category: "Mystery",
        description: "A mystery thriller following symbologist Robert Langdon.",
        price: "17.99",
        stock: 28,
        isbn: "9780307474278",
        publishedYear: 2003,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780307474278-L.jpg",
      },
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Fiction",
        description: "A philosophical book about following your dreams.",
        price: "13.99",
        stock: 20,
        isbn: "9780062315007",
        publishedYear: 1988,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
      },
      {
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        category: "Non-Fiction",
        description: "An exploration of the history and impact of Homo sapiens.",
        price: "19.99",
        stock: 24,
        isbn: "9780062316110",
        publishedYear: 2011,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg",
      },
      {
        title: "Educated",
        author: "Tara Westover",
        category: "Biography",
        description: "A memoir about a woman who grows up in a survivalist family and eventually escapes to learn about the wider world through education.",
        price: "16.99",
        stock: 19,
        isbn: "9780399590504",
        publishedYear: 2018,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
      },
      {
        title: "Becoming",
        author: "Michelle Obama",
        category: "Biography",
        description: "The memoir of former First Lady of the United States Michelle Obama.",
        price: "18.99",
        stock: 27,
        isbn: "9781524763138",
        publishedYear: 2018,
        coverImage: "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
      },
      {
        title: "The Hunger Games",
        author: "Suzanne Collins",
        category: "Science Fiction",
        description: "A dystopian novel set in a post-apocalyptic nation where teenagers must fight to the death.",
        price: "15.99",
        stock: 32,
        isbn: "9780439023528",
        publishedYear: 2008,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780439023528-L.jpg",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        category: "Self-Help",
        description: "An easy and proven way to build good habits and break bad ones.",
        price: "17.99",
        stock: 40,
        isbn: "9780735211292",
        publishedYear: 2018,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
      },
      {
        title: "Where the Crawdads Sing",
        author: "Delia Owens",
        category: "Mystery",
        description: "A coming-of-age murder mystery set in the marshes of North Carolina.",
        price: "16.99",
        stock: 21,
        isbn: "9780735219090",
        publishedYear: 2018,
        coverImage: "https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg",
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log("\n📚 Sample login credentials:");
    console.log("  Admin: admin@bookhaven.com / password123");
    console.log("  Staff: staff@bookhaven.com / password123");
    console.log("  Customer: customer@example.com / password123");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  });

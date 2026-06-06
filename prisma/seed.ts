import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "☕ Hot Coffee" },
    { name: "🧊 Cold Coffee" },
    { name: "🍵 Tea & Beverages" },
    { name: "🥐 Breakfast" },
    { name: "🥪 Sandwiches & Burgers" },
    { name: "🍕 Snacks & Fast Food" },
    { name: "🥗 Healthy Options" },
    { name: "🍰 Desserts" },
    { name: "🍨 Ice Cream" },
    { name: "⭐ Signature Specials" },
  ];

  const products = [
    // Hot Coffee
    { name: "Espresso", description: "Rich and intense shot of coffee", price: 150, category: "☕ Hot Coffee", featured: false },
    { name: "Americano", description: "Espresso with hot water", price: 200, category: "☕ Hot Coffee", featured: false },
    { name: "Cappuccino", description: "Espresso with steamed milk and foam", price: 250, category: "☕ Hot Coffee", featured: true },
    { name: "Latte", description: "Espresso with plenty of steamed milk", price: 250, category: "☕ Hot Coffee", featured: false },
    { name: "Mocha", description: "Espresso with chocolate and steamed milk", price: 300, category: "☕ Hot Coffee", featured: false },
    // Cold Coffee
    { name: "Iced Americano", description: "Chilled espresso with water over ice", price: 250, category: "🧊 Cold Coffee", featured: false },
    { name: "Iced Latte", description: "Chilled espresso with milk over ice", price: 300, category: "🧊 Cold Coffee", featured: false },
    { name: "Cold Brew", description: "Slow-steeped cold coffee", price: 350, category: "🧊 Cold Coffee", featured: true },
    // Breakfast
    { name: "Croissant", description: "Flaky and buttery French pastry", price: 200, category: "🥐 Breakfast", featured: true },
    { name: "Pancakes", description: "Fluffy pancakes with syrup", price: 450, category: "🥐 Breakfast", featured: false },
    // Sandwiches & Burgers
    { name: "Beef Burger", description: "Juicy beef patty with lettuce and cheese", price: 750, category: "🥪 Sandwiches & Burgers", featured: true },
    { name: "Chicken Sandwich", description: "Grilled chicken with mayo and greens", price: 600, category: "🥪 Sandwiches & Burgers", featured: false },
    // Snacks
    { name: "French Fries", description: "Crispy golden fries", price: 300, category: "🍕 Snacks & Fast Food", featured: false },
    { name: "Chicken Wings", description: "Spicy and crispy wings", price: 550, category: "🍕 Snacks & Fast Food", featured: true },
  ];

  console.log("Seeding categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("Seeding products...");
  for (const prod of products) {
    const category = await prisma.category.findUnique({
      where: { name: prod.category },
    });

    if (category) {
      await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          categoryId: category.id,
          featured: prod.featured,
          image: `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60`, // Placeholder
        },
      });
    }
  }

  console.log("Seeding tables...");
  for (let i = 1; i <= 20; i++) {
    await prisma.table.upsert({
      where: { tableNumber: i },
      update: {},
      create: { tableNumber: i },
    });
  }

  console.log("Seeding users...");
  await prisma.user.upsert({
    where: { email: "sauravshharma6@gmail.com" },
    update: {},
    create: {
      name: "Saurav Sharma",
      email: "sauravshharma6@gmail.com",
      role: "OWNER",
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

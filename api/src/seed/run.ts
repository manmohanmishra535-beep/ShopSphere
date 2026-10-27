import { resetDb } from "../lib/db.js";

const data = await resetDb();
console.log(
  `Reset ShopSphere data: ${data.products.length} products, ${data.users.length} users, ${data.orders.length} orders, ${data.reviews.length} reviews.`
);
process.exit(0);

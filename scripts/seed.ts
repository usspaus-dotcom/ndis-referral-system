import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, getUserByEmail, createUser } from "../server/db.js";

async function seed() {
  const email = process.env.ADMIN_EMAIL || "accuratehomecare.cs@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "Sanjaya7777777$";
  const name = "Sanjaya Srinath";

  console.log(`Seeding admin user: ${email}`);

  const existing = await getUserByEmail(email);
  if (existing) {
    console.log("Admin user already exists. Skipping.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    email,
    passwordHash,
    name,
    role: "admin",
    createdAt: Date.now(),
  });

  console.log(`Admin user created: ${user.email} (id: ${user.id})`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});

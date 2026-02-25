import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, UserRole } from "./users/user.entity";
import { AppDataSource } from "../data-source"; // adjust if path different

async function seed() {
  try {
    console.log("🚀 Connecting to DB...");
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);

    console.log("🧹 Clearing old users...");
    await userRepo.clear();   // 🔥 truncate table safely

    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const users: Partial<User>[] = [];

    // 👑 Admin user
    users.push({
      email: "admin@example.com",
      full_name: "Admin User",
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      is_active: true,
    });

    // 👥 10 normal users
    for (let i = 1; i <= 10; i++) {
      users.push({
        email: `user${i}@example.com`,
        full_name: `User ${i}`,
        password_hash: hashedPassword,
        role: UserRole.USER,
        is_active: true,
      });
    }

    console.log("👥 Creating users...");
    await userRepo.save(users);

    console.log("✅ Seeding completed successfully!");

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
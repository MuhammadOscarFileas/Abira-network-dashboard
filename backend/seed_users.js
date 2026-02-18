import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import db from "./config/database.js";
import UserModel from "./models/users_model.js";

dotenv.config();

const admins = [
  {
    username: "bayuadi",
    nama_lengkap: "Bayu Adi",
    role: "admin",
  },
  {
    username: "menikrohaya",
    nama_lengkap: "Menik Rohaya",
    role: "admin",
  },
  {
    username: "oscarfileas",
    nama_lengkap: "Oscar Fileas",
    role: "admin",
  },
];

async function seed() {
  try {
    await db.authenticate();
    console.log("Database connected...");

    // Pastikan tabel user sudah ada
    await UserModel.sync();

    const defaultPassword = "admin123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (const admin of admins) {
      const existing = await UserModel.findOne({
        where: { username: admin.username },
      });

      if (existing) {
        console.log(`User ${admin.username} sudah ada, skip.`);
        continue;
      }

      await UserModel.create({
        username: admin.username,
        password: hashedPassword,
        nama_lengkap: admin.nama_lengkap,
        role: admin.role,
        isActive: true,
      });

      console.log(
        `User ${admin.username} dibuat dengan password default: ${defaultPassword}`
      );
    }

    console.log("Seeding selesai.");
    process.exit(0);
  } catch (error) {
    console.error("Gagal seed user admin:", error);
    process.exit(1);
  }
}

seed();


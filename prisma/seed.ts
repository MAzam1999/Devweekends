import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const categories = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Design",
    "Business",
    "Marketing",
    "Photography",
  ];

  for (const name of categories) {
    await db.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log(`Seeded ${categories.length} categories`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

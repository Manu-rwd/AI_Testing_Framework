import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const modules = [
    "Accesare",
    "Autorizare",
    "FRT-Output initial",
    "BKD-Input",
    "BKD-Proces",
    "FRT-Confirmare actiune",
    "FRT-Output final",
    "Reverificare output final",
    "Particulare"
  ];
  for (let i = 0; i < modules.length; i++) {
    await prisma.module.upsert({
      where: { name: modules[i] },
      create: { name: modules[i], order: i + 1 },
      update: { order: i + 1 }
    });
  }
  console.log("Seeded modules");
}

main().finally(async () => prisma.$disconnect());


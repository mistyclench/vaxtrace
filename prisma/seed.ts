import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Outlets
  const mainWarehouse = await prisma.outlet.upsert({
    where: { id: "outlet-main" },
    update: {},
    create: { id: "outlet-main", name: "Main Warehouse", address: "123 Supply Road, Capital City", phone: "+1-555-0100" },
  });
  const branch1 = await prisma.outlet.upsert({
    where: { id: "outlet-branch1" },
    update: {},
    create: { id: "outlet-branch1", name: "Branch 1", address: "45 Distribution Ave, North District", phone: "+1-555-0101" },
  });

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@vaxtrace.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@vaxtrace.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Manager
  const managerPassword = await bcrypt.hash("manager123", 12);
  await prisma.user.upsert({
    where: { email: "manager@vaxtrace.com" },
    update: {},
    create: {
      name: "Jane Manager",
      email: "manager@vaxtrace.com",
      password: managerPassword,
      role: "MANAGER",
      outletId: mainWarehouse.id,
    },
  });

  // Sales user
  const salesPassword = await bcrypt.hash("sales123", 12);
  await prisma.user.upsert({
    where: { email: "sales@vaxtrace.com" },
    update: {},
    create: {
      name: "Tom Sales",
      email: "sales@vaxtrace.com",
      password: salesPassword,
      role: "SALES",
      outletId: mainWarehouse.id,
    },
  });

  // Categories
  const categories = [
    { id: "cat-vaccines", name: "Vaccines" },
    { id: "cat-syringes", name: "Syringes" },
    { id: "cat-coldchain", name: "Cold Chain" },
    { id: "cat-ppe", name: "PPE" },
    { id: "cat-consumables", name: "Consumables" },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { id: cat.id }, update: {}, create: cat });
  }

  // Products
  const products = [
    { id: "prod-001", code: "VAC-BCG", name: "BCG Vaccine", categoryId: "cat-vaccines", unit: "vials", costPrice: 5.00, sellPrice: 8.50, reorderLevel: 100 },
    { id: "prod-002", code: "VAC-OPV", name: "Oral Polio Vaccine (OPV)", categoryId: "cat-vaccines", unit: "vials", costPrice: 3.50, sellPrice: 5.00, reorderLevel: 200 },
    { id: "prod-003", code: "VAC-DTP", name: "DTP Vaccine", categoryId: "cat-vaccines", unit: "vials", costPrice: 7.00, sellPrice: 11.00, reorderLevel: 150 },
    { id: "prod-004", code: "VAC-MMRV", name: "MMRV Vaccine", categoryId: "cat-vaccines", unit: "vials", costPrice: 12.00, sellPrice: 18.00, reorderLevel: 100 },
    { id: "prod-005", code: "SYR-2ML", name: "Syringes 2ml Auto-Disable", categoryId: "cat-syringes", unit: "pieces", costPrice: 0.15, sellPrice: 0.30, reorderLevel: 1000 },
    { id: "prod-006", code: "SYR-5ML", name: "Syringes 5ml Auto-Disable", categoryId: "cat-syringes", unit: "pieces", costPrice: 0.20, sellPrice: 0.40, reorderLevel: 500 },
    { id: "prod-007", code: "CCE-ICEPACK", name: "Ice Packs 0.4L", categoryId: "cat-coldchain", unit: "packs", costPrice: 2.00, sellPrice: 3.50, reorderLevel: 50 },
    { id: "prod-008", code: "PPE-GLOVES-L", name: "Nitrile Gloves Large (box)", categoryId: "cat-ppe", unit: "boxes", costPrice: 8.00, sellPrice: 12.00, reorderLevel: 50 },
    { id: "prod-009", code: "CON-SWABS", name: "Cotton Swabs (100ct)", categoryId: "cat-consumables", unit: "packs", costPrice: 1.00, sellPrice: 1.80, reorderLevel: 200 },
    { id: "prod-010", code: "CON-BANDAGE", name: "Adhesive Bandages (50ct)", categoryId: "cat-consumables", unit: "boxes", costPrice: 2.50, sellPrice: 4.00, reorderLevel: 100 },
  ];
  for (const prod of products) {
    await prisma.product.upsert({ where: { id: prod.id }, update: {}, create: prod });
  }

  // Initial stock
  const stockItems = [
    { productId: "prod-001", outletId: mainWarehouse.id, quantity: 500 },
    { productId: "prod-002", outletId: mainWarehouse.id, quantity: 1000 },
    { productId: "prod-003", outletId: mainWarehouse.id, quantity: 750 },
    { productId: "prod-004", outletId: mainWarehouse.id, quantity: 300 },
    { productId: "prod-005", outletId: mainWarehouse.id, quantity: 5000 },
    { productId: "prod-006", outletId: mainWarehouse.id, quantity: 2500 },
    { productId: "prod-007", outletId: mainWarehouse.id, quantity: 200 },
    { productId: "prod-008", outletId: mainWarehouse.id, quantity: 100 },
    { productId: "prod-009", outletId: mainWarehouse.id, quantity: 600 },
    { productId: "prod-010", outletId: mainWarehouse.id, quantity: 400 },
    // Branch stock
    { productId: "prod-001", outletId: branch1.id, quantity: 150 },
    { productId: "prod-002", outletId: branch1.id, quantity: 300 },
    { productId: "prod-005", outletId: branch1.id, quantity: 1000 },
  ];
  for (const s of stockItems) {
    await prisma.stockItem.upsert({
      where: { productId_outletId: { productId: s.productId, outletId: s.outletId } },
      update: { quantity: s.quantity },
      create: s,
    });
  }

  // Customers
  const customers = [
    {
      id: "cust-001", code: "CUST-001", name: "Ministry of Health - HQ",
      contact: "+1-555-0200", address: "Government Complex, Capital City",
      email: "procurement@moh.gov", creditLimit: 100000, creditDays: 60,
    },
    {
      id: "cust-002", code: "CUST-002", name: "Regional Hospital A",
      contact: "+1-555-0201", address: "1 Hospital Drive, North Region",
      email: "supplies@rhospital-a.org", creditLimit: 50000, creditDays: 30,
    },
    {
      id: "cust-003", code: "CUST-003", name: "Community Health Center B",
      contact: "+1-555-0202", address: "45 Community Blvd, South District",
      email: "admin@chc-b.org", creditLimit: 20000, creditDays: 30,
    },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  // Settings
  const defaultSettings = [
    { key: "company_name", value: "VaxTrace Wholesale Ltd" },
    { key: "company_address", value: "123 Supply Road, Capital City" },
    { key: "company_phone", value: "+1-555-0100" },
    { key: "company_email", value: "info@vaxtrace.com" },
    { key: "default_tax_rate", value: "0" },
    { key: "default_credit_days", value: "30" },
  ];
  for (const s of defaultSettings) {
    await prisma.settings.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("Seed complete!");
  console.log("  Admin: admin@vaxtrace.com / admin123");
  console.log("  Manager: manager@vaxtrace.com / manager123");
  console.log("  Sales: sales@vaxtrace.com / sales123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

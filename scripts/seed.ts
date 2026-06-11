import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";

dotenv.config();

const db = neon(process.env.DATABASE_URL!);

// Helper to generate cuid-like IDs
function id() {
  return "c" + Math.random().toString(36).substr(2, 24);
}

async function seed() {
  console.log("Seeding vaxtrace schema...");

  // Set search path
  await db`SET search_path TO vaxtrace`;

  // Outlets
  const mainId = "outlet-main";
  const branch1Id = "outlet-branch1";

  await db`INSERT INTO vaxtrace."Outlet" (id, name, address, phone) VALUES
    (${mainId}, 'Main Warehouse', '123 Supply Road, Capital City', '+1-555-0100'),
    (${branch1Id}, 'Branch 1', '45 Distribution Ave, North District', '+1-555-0101')
    ON CONFLICT (id) DO NOTHING`;

  // Users
  const adminPwd = await bcrypt.hash("admin123", 12);
  const mgrPwd = await bcrypt.hash("manager123", 12);
  const salesPwd = await bcrypt.hash("sales123", 12);

  const adminId = "user-admin";
  const mgrId = "user-manager";
  const salesUserId = "user-sales";

  await db`INSERT INTO vaxtrace."User" (id, name, email, password, role, "outletId") VALUES
    (${adminId}, 'System Admin', 'admin@vaxtrace.com', ${adminPwd}, 'ADMIN', NULL),
    (${mgrId}, 'Jane Manager', 'manager@vaxtrace.com', ${mgrPwd}, 'MANAGER', ${mainId}),
    (${salesUserId}, 'Tom Sales', 'sales@vaxtrace.com', ${salesPwd}, 'SALES', ${mainId})
    ON CONFLICT (email) DO NOTHING`;

  // Categories
  const cats = [
    ["cat-vaccines", "Vaccines"],
    ["cat-syringes", "Syringes"],
    ["cat-coldchain", "Cold Chain"],
    ["cat-ppe", "PPE"],
    ["cat-consumables", "Consumables"],
  ];
  for (const [cid, cname] of cats) {
    await db`INSERT INTO vaxtrace."Category" (id, name) VALUES (${cid}, ${cname}) ON CONFLICT (id) DO NOTHING`;
  }

  // Products
  const products = [
    ["prod-001", "VAC-BCG", "BCG Vaccine", "cat-vaccines", "vials", 5.00, 8.50, 100],
    ["prod-002", "VAC-OPV", "Oral Polio Vaccine (OPV)", "cat-vaccines", "vials", 3.50, 5.00, 200],
    ["prod-003", "VAC-DTP", "DTP Vaccine", "cat-vaccines", "vials", 7.00, 11.00, 150],
    ["prod-004", "VAC-MMRV", "MMRV Vaccine", "cat-vaccines", "vials", 12.00, 18.00, 100],
    ["prod-005", "SYR-2ML", "Syringes 2ml Auto-Disable", "cat-syringes", "pieces", 0.15, 0.30, 1000],
    ["prod-006", "SYR-5ML", "Syringes 5ml Auto-Disable", "cat-syringes", "pieces", 0.20, 0.40, 500],
    ["prod-007", "CCE-ICEPACK", "Ice Packs 0.4L", "cat-coldchain", "packs", 2.00, 3.50, 50],
    ["prod-008", "PPE-GLOVES-L", "Nitrile Gloves Large (box)", "cat-ppe", "boxes", 8.00, 12.00, 50],
    ["prod-009", "CON-SWABS", "Cotton Swabs (100ct)", "cat-consumables", "packs", 1.00, 1.80, 200],
    ["prod-010", "CON-BANDAGE", "Adhesive Bandages (50ct)", "cat-consumables", "boxes", 2.50, 4.00, 100],
  ];
  for (const [pid, code, name, catId, unit, cost, sell, reorder] of products) {
    await db`INSERT INTO vaxtrace."Product" (id, code, name, "categoryId", unit, "costPrice", "sellPrice", "reorderLevel")
      VALUES (${pid as string}, ${code as string}, ${name as string}, ${catId as string}, ${unit as string}, ${cost as number}, ${sell as number}, ${reorder as number})
      ON CONFLICT (id) DO NOTHING`;
  }

  // Stock
  const stockItems = [
    ["prod-001", mainId, 500], ["prod-002", mainId, 1000], ["prod-003", mainId, 750],
    ["prod-004", mainId, 300], ["prod-005", mainId, 5000], ["prod-006", mainId, 2500],
    ["prod-007", mainId, 200], ["prod-008", mainId, 100], ["prod-009", mainId, 600],
    ["prod-010", mainId, 400],
    ["prod-001", branch1Id, 150], ["prod-002", branch1Id, 300], ["prod-005", branch1Id, 1000],
  ];
  for (const [pId, oId, qty] of stockItems) {
    const sid = id();
    await db`INSERT INTO vaxtrace."StockItem" (id, "productId", "outletId", quantity)
      VALUES (${sid}, ${pId as string}, ${oId as string}, ${qty as number})
      ON CONFLICT ("productId", "outletId") DO UPDATE SET quantity = EXCLUDED.quantity`;
  }

  // Customers
  const customers = [
    ["cust-001", "CUST-001", "Ministry of Health - HQ", "+1-555-0200", "Government Complex, Capital City", "procurement@moh.gov", 100000, 60],
    ["cust-002", "CUST-002", "Regional Hospital A", "+1-555-0201", "1 Hospital Drive, North Region", "supplies@rhospital-a.org", 50000, 30],
    ["cust-003", "CUST-003", "Community Health Center B", "+1-555-0202", "45 Community Blvd, South District", "admin@chc-b.org", 20000, 30],
  ];
  for (const [cid, code, name, contact, address, email, limit, days] of customers) {
    await db`INSERT INTO vaxtrace."Customer" (id, code, name, contact, address, email, "creditLimit", "creditDays")
      VALUES (${cid as string}, ${code as string}, ${name as string}, ${contact as string}, ${address as string}, ${email as string}, ${limit as number}, ${days as number})
      ON CONFLICT (id) DO NOTHING`;
  }

  // Settings
  const settings = [
    ["company_name", "VaxTrace Wholesale Ltd"],
    ["company_address", "123 Supply Road, Capital City"],
    ["company_phone", "+1-555-0100"],
    ["company_email", "info@vaxtrace.com"],
    ["default_tax_rate", "0"],
    ["default_credit_days", "30"],
    ["currency_code", "GHS"],
    ["currency_symbol", "GH₵"],
  ];
  for (const [key, value] of settings) {
    const sid = id();
    await db`INSERT INTO vaxtrace."Settings" (id, key, value) VALUES (${sid}, ${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }

  console.log("Seed complete!");
  console.log("  Logins: admin@vaxtrace.com / admin123");
}

seed().catch(e => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});

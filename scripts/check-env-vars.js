/**
 * Script to check environment variables from .env.backup
 * Compares .env.backup with current .env and shows what's missing
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envBackupPath = join(__dirname, "..", ".env.backup");
const envPath = join(__dirname, "..", ".env");

console.log("🔍 Checking Environment Variables...\n");

if (!existsSync(envBackupPath)) {
  console.error("❌ .env.backup file not found!");
  process.exit(1);
}

// Read .env.backup
const envBackup = readFileSync(envBackupPath, "utf-8");
const backupVars = new Map();

envBackup.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key] = trimmed.split("=");
    if (key) {
      backupVars.set(key.trim(), true);
    }
  }
});

console.log(`📋 Found ${backupVars.size} variables in .env.backup\n`);

// Read current .env if exists
const currentVars = new Map();
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key] = trimmed.split("=");
      if (key) {
        currentVars.set(key.trim(), true);
      }
    }
  });
  console.log(`📋 Found ${currentVars.size} variables in current .env\n`);
} else {
  console.log("⚠️  .env file not found - you need to create it!\n");
}

// Compare
const missingVars = [];
const extraVars = [];

backupVars.forEach((_, key) => {
  if (!currentVars.has(key)) {
    missingVars.push(key);
  }
});

currentVars.forEach((_, key) => {
  if (!backupVars.has(key)) {
    extraVars.push(key);
  }
});

console.log("=".repeat(60));
if (missingVars.length > 0) {
  console.log(`\n❌ MISSING VARIABLES (${missingVars.length}):`);
  console.log("=".repeat(60));
  missingVars.forEach((v) => console.log(`  - ${v}`));
} else {
  console.log("\n✅ All variables from .env.backup are present in .env");
}

if (extraVars.length > 0) {
  console.log(
    `\n⚠️  EXTRA VARIABLES in .env (not in backup) (${extraVars.length}):`
  );
  console.log("=".repeat(60));
  extraVars.forEach((v) => console.log(`  - ${v}`));
}

console.log("\n" + "=".repeat(60));
console.log("\n💡 Tip: Copy missing variables from .env.backup to .env\n");

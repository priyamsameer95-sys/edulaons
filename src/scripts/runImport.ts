import { runDataImport } from "./importData";

// Run the import immediately when this file is loaded
console.log("🚀 Running data import automatically...");
runDataImport()
  .then(() => {
    console.log("✅ Data import completed successfully!");
  })
  .catch((error) => {
    console.error("❌ Data import failed:", error);
  });
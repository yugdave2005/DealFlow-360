import { getQuotationById } from './src/modules/quotations/quotation.service.js';

async function test() {
  try {
    const quote = await getQuotationById("359731f3-5b92-426c-8219-6b84dca1f12e", "admin-id", "ADMIN");
    console.log("Admin fetch result:", quote ? "FOUND" : "NOT FOUND");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  "src/config",
  "src/middleware",
  "src/services/email",
  "src/services/oauth",
  "src/services/token",
  "src/queues/publishers",
  "src/queues/consumers",
  "src/events",
  "src/utils",
  "src/routes"
];

const modules = [
  "auth", "users", "customers", "products", "quotations", "pricing", 
  "discounts", "approvals", "inventory", "warehouses", "fulfillment", 
  "negotiations", "subscriptions", "billing", "invoices", "payments", 
  "notifications", "analytics", "audit"
];

for (const dir of dirs) {
    fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
}

for (const mod of modules) {
    const modDir = path.join(__dirname, "src/modules", mod);
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.join(modDir, "controller.js"), "");
    fs.writeFileSync(path.join(modDir, "service.js"), "");
    fs.writeFileSync(path.join(modDir, "repository.js"), "");
    fs.writeFileSync(path.join(modDir, "routes.js"), "");
    fs.writeFileSync(path.join(modDir, "validation.js"), "");
}

const files = [
  "src/config/env.js",
  "src/config/database.js",
  "src/config/redis.js",
  "src/config/rabbitmq.js",
  "src/middleware/auth.js",
  "src/middleware/role.js",
  "src/middleware/error.js",
  "src/middleware/not-found.js",
  "src/middleware/rate-limit.js",
  "src/services/email/brevo.service.js",
  "src/services/oauth/google.service.js",
  "src/services/token/jwt.service.js",
  "src/queues/queue.constants.js",
  "src/events/event.types.js",
  "src/events/event.publisher.js",
  "src/utils/logger.js",
  "src/utils/response.js",
  "src/utils/errors.js",
  "src/routes/index.js",
  "src/app.js",
  "src/server.js",
  ".env.example"
];

for (const f of files) {
    fs.writeFileSync(path.join(__dirname, f), "");
}

console.log("Structure created successfully.");

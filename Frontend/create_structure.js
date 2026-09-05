import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  "src/assets",
  "src/components/ui",
  "src/components/layout",
  "src/components/common",
  "src/components/feedback",
  "src/pages/auth",
  "src/pages/sales",
  "src/pages/customer",
  "src/pages/admin",
  "src/layouts",
  "src/routes",
  "src/hooks",
  "src/lib",
  "src/services",
  "src/schemas",
  "src/constants",
  "src/context",
  "src/config"
];

const features = [
  "auth", "dashboard", "quotations", "approvals", "customers", "products", 
  "fulfillment", "inventory", "subscriptions", "billing", "invoices", 
  "negotiations", "analytics", "deal-health", "admin"
];

for (const dir of dirs) {
    fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
}

for (const feat of features) {
    const featDir = path.join(__dirname, "src/features", feat);
    fs.mkdirSync(path.join(featDir, "components"), { recursive: true });
    fs.mkdirSync(path.join(featDir, "hooks"), { recursive: true });
    fs.writeFileSync(path.join(featDir, `${feat}.api.js`), "");
    fs.writeFileSync(path.join(featDir, `${feat}.constants.js`), "");
    fs.writeFileSync(path.join(featDir, `${feat}.schemas.js`), "");
    fs.writeFileSync(path.join(featDir, `${feat}.utils.js`), "");
}

const files = [
  "src/layouts/AuthLayout.jsx",
  "src/layouts/SalesLayout.jsx",
  "src/layouts/CustomerLayout.jsx",
  "src/layouts/AdminLayout.jsx",
  "src/routes/AppRoutes.jsx",
  "src/routes/ProtectedRoute.jsx",
  "src/routes/RoleRoute.jsx",
  "src/lib/axios.js",
  "src/lib/queryClient.js",
  "src/lib/utils.js",
  "src/services/auth.service.js",
  "src/services/api.service.js",
  "src/App.jsx",
  "src/main.jsx",
  "src/index.css"
];

for (const f of files) {
    fs.writeFileSync(path.join(__dirname, f), "");
}

console.log("Frontend structure created successfully.");

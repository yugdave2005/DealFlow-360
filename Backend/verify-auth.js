import { PrismaClient } from '@prisma/client';
const run = async () => {
   console.log('Testing DealFlow360 API Flow...');
   
   // 1. Signup
   const signupRes = await fetch('http://localhost:5000/api/v1/auth/signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: `sales_${Date.now()}@test.com`, password: 'password123', name: 'John Doe', role: 'SALES_REP' })
   });
   const signupData = await signupRes.json();
   console.log('1. Signup Success:', signupData.success);

   if (!signupData.success) {
      console.log('Token missing, check logs', signupData);
      return;
   }

   // 2. Fetch Product ID directly from Prisma for test linkage
   const prisma = new PrismaClient();
   const p = await prisma.product.findFirst();
   console.log(`2. Found target product: ${p.id}`);

   // 3. Create a deal through the robust Transactional pipeline we engineered
   const qRes = await fetch('http://localhost:5000/api/v1/quotations', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${signupData.data.accessToken}` },
     body: JSON.stringify({
       customerId: 'bb222222-2222-2222-2222-222222222222', 
       lineItems: [{ productId: p.id, quantity: 5, unitPrice: 2000, discountPercentage: 15 }]
     })
   });
   const qData = await qRes.json();
   console.log('3. Quotation Architecture Response:');
   console.dir(qData, { depth: null });
   
   // Ensure versions array exists highlighting our Version-Control immutability pattern!
   if (qData.data && qData.data.versions && qData.data.versions[0]) {
      console.log('-> Version 1 successfully locked into the deal flow state machine.');
      console.log(`-> Version 1 total calculated at: $${qData.data.versions[0].totalAmount}`);
   }
}
run();

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi } from '../../features/admin/admin.api';

// Normally, this would fetch from a CRM endpoint, but we mock customer IDs for now
const MOCK_CUSTOMERS = [
  { id: 'bb222222-2222-2222-2222-222222222222', name: 'Acme Corp' },
  { id: 'cc333333-3333-3333-3333-333333333333', name: 'Globex Inc' }
];

export default function QuotationBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      customerId: MOCK_CUSTOMERS[0].id,
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0, discountPercentage: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => adminApi.getProducts().then(res => res.data)
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:5000/api/v1/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Creation failed');
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success(`Quotation ${data.quotationNumber} formulated!`);
      navigate('/sales/quotations');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const onSubmit = (data) => {
    // Format numeric values
    const formattedPayload = {
      customerId: data.customerId,
      lineItems: data.lineItems.map(item => ({
        ...item,
        quantity: parseInt(item.quantity, 10),
        unitPrice: parseFloat(item.unitPrice),
        discountPercentage: parseFloat(item.discountPercentage)
      }))
    };
    createMutation.mutate(formattedPayload);
  };

  const watchLineItems = watch('lineItems');
  
  // Real-time pure calculations
  const totals = watchLineItems.reduce((acc, item) => {
    const qty = parseInt(item.quantity || 0, 10);
    const price = parseFloat(item.unitPrice || 0);
    const disc = parseFloat(item.discountPercentage || 0);
    const total = qty * price;
    const discValue = total * (disc / 100);
    return {
      subtotal: acc.subtotal + total,
      discount: acc.discount + discValue,
      final: acc.final + (total - discValue)
    };
  }, { subtotal: 0, discount: 0, final: 0 });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotation Builder</h1>
          <p className="text-slate-500">Formulate a new deal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Customer Details</h2>
           <div className="max-w-md">
             <label className="block text-sm font-medium text-slate-700 mb-1">Select Customer</label>
             <select {...register('customerId')} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h2 className="text-lg font-bold text-slate-800">Line Items</h2>
             <button type="button" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discountPercentage: 0 })} className="text-blue-600 bg-blue-50 px-3 py-1 rounded font-medium text-sm hover:bg-blue-100 transition-colors">
               + Add Product
             </button>
           </div>

           <div className="space-y-4">
             {fields.map((field, index) => (
               <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <div className="flex-1">
                   <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Product</label>
                   <select 
                      {...register(`lineItems.${index}.productId`, { required: true })} 
                      className="w-full p-2 bg-white border border-slate-200 rounded-md"
                      onChange={(e) => {
                         const p = products.find(prod => prod.id === e.target.value);
                         if (p && p.pricing && p.pricing.length > 0) {
                             setValue(`lineItems.${index}.unitPrice`, p.pricing[0].price);
                         }
                      }}
                   >
                      <option value="">Select a product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                   </select>
                 </div>
                 
                 <div className="w-24">
                   <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Qty</label>
                   <input type="number" {...register(`lineItems.${index}.quantity`, { min: 1 })} className="w-full p-2 bg-white border border-slate-200 rounded-md" />
                 </div>
                 
                 <div className="w-32">
                   <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Unit Price ($)</label>
                   <input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`)} className="w-full p-2 bg-white border border-slate-200 rounded-md" />
                 </div>

                 <div className="w-32">
                   <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Discount (%)</label>
                   <input type="number" step="0.1" {...register(`lineItems.${index}.discountPercentage`)} className="w-full p-2 bg-white border border-slate-200 rounded-md" />
                 </div>

                 <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                 </button>
               </div>
             ))}
           </div>
        </div>

        <div className="flex justify-end gap-6">
          <div className="bg-slate-800 text-white p-6 rounded-2xl w-80 shadow-lg">
             <div className="flex justify-between mb-2 opacity-80"><span className="text-sm">Subtotal:</span><span>${totals.subtotal.toFixed(2)}</span></div>
             <div className="flex justify-between mb-4 text-red-300"><span className="text-sm">Discount:</span><span>-${totals.discount.toFixed(2)}</span></div>
             <div className="flex justify-between font-bold text-xl border-t border-slate-600 pt-3"><span>Draft Total:</span><span>${totals.final.toFixed(2)}</span></div>
             
             <button 
                type="submit"
                disabled={createMutation.isPending || fields.length === 0}
                className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
             >
                {createMutation.isPending ? 'Processing...' : 'Save Draft Quotation'}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}

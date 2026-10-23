'use strict';
// Local, deterministic tests; no marketplace/account/API calls.
// Run from the repository root: node --test tests/competitor-calculator-fees.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../ebay-competitor-calculator-core-v1.js');
const fixture = {...C.MARKET_FEES.US,ebayFee:.1325,internationalFee:.016,salesTaxEstimate:.0417,vatOnFees:.22,marketingFee:0};
const order = {quantity:2,sellerDiscountPct:5,shipping:3.99};

test('eBay actual sample, without General Ads: fees 7.37 USD',()=>{
 const r=C.fees(14.99,fixture,1,null,order);
 assert.deepEqual([r.discount,r.itemNet,r.tax,r.masterPerUnit,r.masterTotal],[.75,14.24,.76,18.99,37.98]);
 assert.deepEqual([r.fvf,r.intl,r.ads,r.fixedLocal,r.feeSubtotal,r.vat,r.fee],[5.04,.6,0,.4,6.04,1.33,7.37]);
 assert.deepEqual([r.buyerRevenue,r.salesTaxTotal,r.net],[36.46,1.52,29.09]);
});
test('eBay simulation with 5 percent General Ads: fees 9.69, net 26.77 USD',()=>{
 const r=C.fees(14.99,{...fixture,marketingFee:.05},1,null,order);
 assert.deepEqual([r.masterTotal,r.fvf,r.intl,r.adsPerUnit,r.ads,r.fixedLocal,r.feeSubtotal,r.vat,r.fee],[37.98,5.04,.6,.95,1.9,.4,7.94,1.75,9.69]);
 assert.deepEqual([r.buyerRevenue,r.net],[36.46,26.77]);
});
test('rounding half-cent in decimal units and inverse discounts',()=>{
 assert.equal(C.round(8.075),8.08);
 assert.equal(C.round(-8.075),-8.08);
 assert.equal(C.adjusted(100,-2),98);
 assert.equal(C.adjusted(100,2),102);
});
test('discount applies to item only; sales tax includes customer shipping by default',()=>{
 const t=C.transactionTotals(14.99,fixture,order);
 assert.equal(t.itemNet,14.24);
 assert.equal(t.beforeTax,18.23);
 assert.equal(t.taxableBase,18.23);
 assert.equal(t.tax,.76);
});
test('optional future exclusion of shipping from sales tax; shipping remains fee base',()=>{
 const t=C.transactionTotals(14.99,fixture,{...order,taxShipping:false});
 assert.deepEqual([t.taxableBase,t.tax,t.beforeTax,t.masterPerUnit],[14.24,.59,18.23,18.82]);
});
test('zero Sales Tax, marketing and VAT supported',()=>{
 const r=C.fees(14.99,{...fixture,salesTaxEstimate:0,marketingFee:0,vatOnFees:0},1,null,order);
 assert.equal(r.tax,0);
 assert.equal(r.ads,0);
 assert.equal(r.vat,0);
 assert.equal(r.fee,r.feeSubtotal);
});
test('US/CA order fee threshold is local and charged once per order',()=>{
 for(const mk of ['US','CA']){
  const f={...C.MARKET_FEES[mk],salesTaxEstimate:0};
  assert.equal(C.perOrderFee(9.99,f),.3);
  assert.equal(C.perOrderFee(10.01,f),.4);
  assert.equal(C.perOrderFee(6,f,{quantity:2}),.4);
  assert.equal(C.feeItems(12,f,{quantity:2}).fixedLocal,.4);
 }
});
test('AU screenshot category example: fees 4.39 AUD',()=>{
 const r=C.feeItems(22.12,C.MARKET_FEES.AU);
 assert.deepEqual([r.masterPerUnit,r.fvf,r.intl,r.fixedLocal,r.vat,r.fee],[24.11,2.94,.39,.27,.79,4.39]);
});
test('US screenshot without temporary 6 percent: fees 2.12 USD',()=>{
 const r=C.feeItems(8.83,{...C.MARKET_FEES.US,marketingFee:0});
 assert.deepEqual([r.masterPerUnit,r.fvf,r.intl,r.fixedLocal,r.fee],[9.45,1.29,.15,.3,2.12]);
});
test('tax is not seller revenue; cost is not in the commissionable base',()=>{
 const rates={...fixture,marketingFee:.05};
 const a=C.fees(14.99,rates,1,null,order);
 const b=C.fees(14.99,rates,1,5.29,order);
 assert.equal(a.masterTotal,b.masterTotal);
 assert.equal(a.fee,b.fee);
 assert.equal(a.buyerRevenue,36.46);
 assert.equal(b.costUsd,10.58);
 assert.equal(b.profitUSD,C.round(a.net-10.58));
});
test('negative or fractional quantities rejected, no fabricated exchange rate',()=>{
 assert.equal(C.feeItems(14.99,fixture,{quantity:1.5}),null);
 assert.equal(C.feeItems(14.99,fixture,{quantity:0}),null);
 const r=C.fees(14.99,fixture,null,5.29,order);
 assert.equal(r.profitUSD,null);
 assert.equal(r.breakEven,null);
});
test('break-even is minimal by cents across three currencies and quantities',()=>{
 for(const mk of ['US','CA','AU']){
  const fx=mk==='US'?1:mk==='CA'?.71:.7;
  const rates={...C.MARKET_FEES[mk],sellerDiscountPct:5,shippingCharge:3.99};
  for(const qty of [1,2,5])for(const cost of [0,1,5.29,9.5,35,150]){
   const options={quantity:qty,shipping:rates.shippingCharge};
   const be=C.fees(20,rates,fx,cost,options).breakEven;
   assert.notEqual(be,null);
   const r=C.fees(be,rates,fx,cost,options);
   assert.ok(r.net*fx + .0001 >= cost*qty,JSON.stringify({mk,qty,cost,be}));
   if(be>.01){
    const prev=C.fees(C.round(be-.01),rates,fx,cost,options);
    assert.ok(prev.net*fx < cost*qty + .0001,JSON.stringify({mk,qty,cost,be}));
   }
  }
 }
});

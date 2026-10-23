'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../ebay-competitor-variants-v1.js');
const T=require('../ebay-competitor-catalog-transport-v1.js');
const C=require('../ebay-competitor-calculator-core-v1.js');
const sample={
 ok:true,itemId:'147603152307',hasVariations:true,currency:'USD',
 dimensions:[{name:'Color',values:['PINK','BLACK']},{name:'Size',values:['M','L']}],
 variants:[
  {sourcePrice:7.56,specifics:[{name:'Color',value:'PINK'},{name:'Size',value:'M'}]},
  {sourcePrice:8.56,specifics:[{name:'Color',value:'BLACK'},{name:'Size',value:'L'}]}
 ]
};
test('same existing single product catalog data: exactly 3 fields',()=>{
 const p=T.buildPackage({itemId:sample.itemId,title:'Item',price:7.18},'US');
 assert.equal(p.rows.length,1);assert.equal(p.hasVariations,false);
 assert.deepEqual(p.rows[0].filter(Boolean),[sample.itemId,'Item','7.18'])
});
test('eBay backend mono response leaves variant section disabled',()=>{
 const x=V.normalize({ok:true,itemId:sample.itemId,hasVariations:false},'USD',sample.itemId);
 assert.equal(x.hasVariations,false);assert.equal(x.variants.length,0)
});
test('response with wrong item ID rejected',()=>{
 assert.throws(()=>V.normalize({...sample,itemId:'111111111111'},'USD',sample.itemId),/ID prodotto diverso/)
});
test('incomplete attributes cannot generate phantom variants',()=>{
 assert.throws(()=>V.normalize({...sample,variants:[{sourcePrice:7,specifics:[{name:'Color',value:'PINK'}]}]},'USD',sample.itemId),/priva dell’attributo/)
});
test('two attributes produce distinct combination identifiers',()=>{
 const x=V.normalize(sample,'USD',sample.itemId);
 assert.equal(x.variants.length,2);
 assert.notEqual(x.variants[0].key,x.variants[1].key);
 assert.ok(x.variants[0].label.includes('Color: PINK'))
});
test('missing detected price remains unset',()=>{
 const x=V.normalize({...sample,variants:[{specifics:sample.variants[0].specifics}]},'USD',sample.itemId);
 assert.equal(x.variants[0].sourcePrice,null);
 assert.equal(V.marketPrice(x.variants[0],{USD:1,CAD:.71},'CAD',C.round),null)
});
test('convert detected variant independently with supplied exchange rate',()=>{
 const x=V.normalize(sample,'USD',sample.itemId);
 assert.equal(V.marketPrice(x.variants[0],{USD:1,CAD:.71},'CAD',C.round),10.65)
});
test('parent-child eBay template with all attributes and own prices',()=>{
 const x=V.normalize(sample,'USD',sample.itemId);
 const p=T.buildVariantPackage({itemId:sample.itemId,title:'Variation Item',price:7.41,dimensions:x.dimensions,
 variants:x.variants.map((v,i)=>({specifics:v.specifics,price:i===0?7.41:8.56}))},'CA');
 const at=name=>p.headers.indexOf(name);
 assert.equal(p.rows.length,3);
 assert.equal(p.rows[0][at('Start price')],'');
 assert.equal(p.rows[0][at('Relationship details')],'Color=PINK;BLACK|Size=M;L');
 assert.equal(p.rows[1][at('Relationship')],'Variation');
 assert.equal(p.rows[1][at('Relationship details')],'Color=PINK|Size=M');
 assert.equal(p.rows[2][at('Start price')],'8.56');
 assert.equal(p.rows[1][at('Quantity')],'');
 assert.equal(p.rows[0][at('Title')],'Variation Item');
 assert.ok(T.toCsv(p).includes('Color=PINK;BLACK|Size=M;L'))
});
test('no fabricated prices permitted in variant catalog',()=>{
 const x=V.normalize(sample,'USD',sample.itemId);
 assert.throws(()=>T.buildVariantPackage({itemId:sample.itemId,title:'X',price:7.41,dimensions:x.dimensions,
 variants:x.variants.map(v=>({specifics:v.specifics,price:null}))},'US'),/Prezzo mancante/)
});
test('duplicate option combination rejected before saving',()=>{
 const x=V.normalize(sample,'USD',sample.itemId);
 const repeated={specifics:x.variants[0].specifics,price:7};
 assert.throws(()=>T.buildVariantPackage({itemId:sample.itemId,title:'X',price:7,dimensions:x.dimensions,
 variants:[repeated,repeated]},'US'),/duplicata/)
});
test('unsafe separators in combination rejected',()=>{
 const x=V.normalize(sample,'USD',sample.itemId);
 assert.throws(()=>T.buildVariantPackage({itemId:sample.itemId,title:'X',price:7,dimensions:[{name:'Color',values:['A|B']}],
 variants:[{specifics:[{name:'Color',value:'A|B'}],price:7}]},'US'),/non adatto/)
});


test('realistic eBay CA plug types selector enables variants despite a mono backend',()=>{
 const options=[
  ['','Select',false],['595327416100','1M Cable',false],
  ['595327416101','EU Plug Yellow',false],['595327416102','US Plug Yellow',false],
  ['595327416103','EU Plug Black',false],['595327416105','US Plug Black',true],
  ['595327416106','EU Plug White',false],['595327416107','US Plug White',false]
 ].map(([value,textContent,selected])=>({value,textContent,selected,disabled:false}));
 const parent={textContent:'plug types: US Plug Black',querySelector(){return null}};
 const select={id:'x-msku__select-box',name:'plugTypes',value:'595327416105',options,
  getAttribute(k){return k==='data-testid'?'x-msku__select':''},
  closest(k){return k==='label'?parent:null},parentElement:parent};
 const page={querySelectorAll(q){return q==='select'?[select]:[]}};
 const found=V.inspectPage(page,'https://www.ebay.ca/itm/298471057540?var=595327416105',6.87,'USD','298471057540');
 assert.equal(found.hasVariations,true);assert.equal(found.variants.length,7);
 const master=found.variants.find(v=>v.key===found.selectedKey);
 assert.equal(master.label,'plug types: US Plug Black');
 assert.equal(master.sourcePrice,6.87);
 assert.ok(found.variants.filter(v=>v!==master).every(v=>v.sourcePrice===null));
});
test('a page without variant options still has no variant block',()=>{
 const page={querySelectorAll(){return[]}};
 const result=V.inspectPage(page,'https://www.ebay.ca/itm/298471057540',6.87,'USD','298471057540');
 assert.equal(result.hasVariations,false);assert.equal(result.hasSelects,false)
});
test('multiple independent selector dimensions do not fabricate cartesian combinations',()=>{
 const part=value=>({
  id:'variation-'+value,name:value,value:'x',
  options:[{value:'x',textContent:'X',selected:true,disabled:false},{value:'y',textContent:'Y',selected:false,disabled:false}],
  getAttribute(){return''},closest(){return null},
  parentElement:{textContent:value+': X',querySelector(){return null}}
 });
 const page={querySelectorAll(q){return q==='select'?[part('Color'),part('Size')]:[]}};
 const result=V.inspectPage(page,'https://www.ebay.ca/itm/298471057540',6.87,'USD','298471057540');
 assert.equal(result.hasVariations,false);assert.equal(result.hasSelects,true);
 assert.ok(/combinazioni/.test(result.reason))
});
test('backend variant payload may omit itemId without being mislabeled',()=>{
 const p={...sample};delete p.itemId;
 const r=V.normalize(p,'USD','147603152307');
 assert.equal(r.variants.length,2)
});

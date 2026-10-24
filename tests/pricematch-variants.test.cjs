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
test('single item gets eBay template master fields without a fake SKU',()=>{
 const p=T.buildPackage({itemId:sample.itemId,title:'Item',price:7.18},'US');
 const at=k=>p.headers.indexOf(k),row=p.rows[0];
 assert.equal(p.rows.length,1);assert.equal(p.hasVariations,false);
 assert.equal(row[0],'Add');
 assert.equal(row[at('Custom label (SKU)')],'');
 assert.equal(row[at('Title')],'Item');
 assert.equal(row[at('Start price')],'7.18');
 assert.equal(row[at('Quantity')],'1');
 assert.equal(row[at('Payment profile name')],'Payment Policy');
 assert.equal(row[at('Condition ID')],'1000');
 assert.equal(row[at('Format')],'FixedPrice');
 assert.equal(row[at('Duration')],'GTC');
 assert.equal(row[at('Location')],'Fort Pierce, FL');
 assert.equal(row[at('C:Brand')],'Unbranded');
 assert.equal(row[at('C:MPN')],'000'+sample.itemId);
 assert.equal(row[at('Category ID')],'');
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
 assert.equal(p.rows[1][at('Quantity')],'1');
 assert.equal(p.rows[0][at('Quantity')],'');
 assert.equal(p.rows[0][at('Custom label (SKU)')],'');
 assert.ok(p.rows[1][at('Custom label (SKU)')]);
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


test('modern eBay Skin listbox-button is detected without native select options',()=>{
 const values=['Select','1M Cable','EU Plug Yellow','US Plug Yellow','EU Plug Black','US Plug Black','EU Plug White','US Plug White'];
 const options=values.map((value,i)=>({
  textContent:value,disabled:false,
  classList:{contains(c){return c==='listbox__option--selected'&&i===5}},
  getAttribute(k){return k==='aria-selected'?(i===5?'true':'false'):k==='data-value'?(i===5?'595327416105':''):''},
  querySelector(){return{textContent:value}}
 }));
 const group={querySelector(sel){return sel.includes('label')?{textContent:'plug types:'}:null}};
 const trigger={textContent:'US Plug Black',getAttribute(k){return k==='aria-label'?'plug types: US Plug Black':''}};
 const optionsBox={querySelectorAll(){return options}};
 const container={matches(sel){return sel==='.listbox-button'},querySelector(sel){
   return sel.startsWith('button[')?trigger:optionsBox;
  },closest(){return group},parentElement:group};
 const doc={querySelectorAll(sel){return sel==='select'?[]:sel.includes('.listbox-button')?[container]:[]}};
 const found=V.inspectPage(doc,'https://www.ebay.ca/itm/298471057540?var=595327416105',6.87,'USD','298471057540');
 assert.equal(found.hasVariations,true);assert.equal(found.variants.length,7);
 assert.equal(found.selectedKey,'plug types=us plug black');
 assert.equal(found.variants.find(v=>v.key===found.selectedKey).sourcePrice,6.87);
 assert.ok(found.variants.filter(v=>v.key!==found.selectedKey).every(v=>v.sourcePrice===null));
});
test('unrelated eBay toolbar listboxes do not create product variations',()=>{
 const doc={querySelectorAll(sel){return sel==='select'?[]:[]}};
 const found=V.inspectPage(doc,'https://www.ebay.ca/itm/298471057540',6.87,'USD','298471057540');
 assert.equal(found.hasVariations,false);
 assert.equal(found.hasSelects,false)
});


test('reads exact prices for every variation from embedded eBay MSKU JSON',()=>{
 const state={
  variationsMap:{
   '551':{binModel:{price:{textSpans:[{text:'US $6.87'}]}}},
   '552':{binModel:{price:{textSpans:[{text:'US $8.99'}]}}},
   '553':{binModel:{price:{textSpans:[{text:'US $7.45'}]}}}
  },
  menuItemMap:{
   '0':{valueId:'50',displayName:'EU Plug Yellow'},
   '1':{valueId:'51',displayName:'US Plug Black'},
   '2':{valueId:'52',displayName:'US Plug White'}
  },
  variationCombinations:{'0':'551','1':'552','2':'553'},
  selectMenus:[{displayLabel:'plug types',menuItemValueIds:['50','51','52']}]
 };
 const doc={querySelectorAll(q){return q==='script:not([src])'?[{
  textContent:'window.__item={"MSKU":'+JSON.stringify(state)+',"QUANTITY":{"max":5}};'
 }]:[]}};
 const input=['EU Plug Yellow','US Plug Black','US Plug White'].map(label=>({
  specifics:[{name:'plug types',value:label}],sourcePrice:null,sourceCurrency:'USD'
 }));
 const res=V.enrichVariantsFromPage(doc,input,'USD');
 assert.deepEqual(res.map(v=>v.sourcePrice),[6.87,8.99,7.45]);
 assert.ok(res.every(v=>v.priceSource==='ebay-msku'));
});
test('incomplete or unrelated eBay MSKU data cannot invent missing prices',()=>{
 const state={variationsMap:{'600':{binModel:{price:{textSpans:[{text:'US $99'}]}}}},
 menuItemMap:{'0':{valueId:'3',displayName:'Blue'}},variationCombinations:{'0':'600'},
 selectMenus:[{displayLabel:'Color',menuItemValueIds:['3']}]};
 const doc={querySelectorAll(q){return q==='script:not([src])'?[{textContent:'{"MSKU":'+JSON.stringify(state)+'}'}]:[]}};
 const original=[{specifics:[{name:'plug types',value:'US Plug Black'}],sourcePrice:null,sourceCurrency:'USD'}];
 assert.equal(V.enrichVariantsFromPage(doc,original,'USD')[0].sourcePrice,null)
});
test('recovery keeps an existing, already verified price unchanged',()=>{
 const state={variationsMap:{'1':{binModel:{price:{textSpans:[{text:'US $9.00'}]}}}},
 menuItemMap:{'1':{valueId:'3',displayName:'Black'}},variationCombinations:{'1':'1'},
 selectMenus:[{displayLabel:'Color',menuItemValueIds:['3']}]};
 const doc={querySelectorAll(q){return q==='script:not([src])'?[{textContent:'{"MSKU":'+JSON.stringify(state)+'}'}]:[]}};
 const original=[{specifics:[{name:'Color',value:'Black'}],sourcePrice:6.87,sourceCurrency:'USD'}];
 assert.equal(V.enrichVariantsFromPage(doc,original,'USD')[0].sourcePrice,6.87)
});


test('the category is copied from a matching eBay breadcrumb, not guessed',()=>{
 const link=(name,url)=>({textContent:name,href:url,getAttribute(){return url}});
 const page={querySelectorAll(q){
  return q==='script[type="application/ld+json"]'?[]:[
   link('Cell Phones & Accessories','https://www.ebay.ca/b/Phones/15032/bn_11'),
   link('Wall Chargers','https://www.ebay.ca/b/Wall-Chargers/123417/bn_5')
  ];
 }};
 const category=V.readItemCategory(page);
 assert.deepEqual(category,{categoryId:'123417',categoryName:'Wall Chargers'});
 const p=T.buildPackage({itemId:sample.itemId,title:'Test',price:3.5,...category},'CA');
 const at=n=>p.headers.indexOf(n);
 assert.equal(p.rows[0][at('Category ID')],'123417');
 assert.equal(p.rows[0][at('Category name')],'Wall Chargers');
});
test('a missing or unverified category is not invented',()=>{
 const page={querySelectorAll(){return[]}};
 assert.deepEqual(V.readItemCategory(page),{categoryId:'',categoryName:''});
});
test('parent-child template writes only variation quantities and preserves all shared defaults',()=>{
 const entry={itemId:sample.itemId,title:'Variant Item',price:5.5,categoryId:'123417',categoryName:'Wall Chargers',
  dimensions:[{name:'Color',values:['Black','White']}],
  variants:[
   {specifics:[{name:'Color',value:'Black'}],price:5.5},
   {specifics:[{name:'Color',value:'White'}],price:7.25}
  ]};
 const pkg=T.buildVariantPackage(entry,'AU'),idx=k=>pkg.headers.indexOf(k);
 const [parent,a,b]=pkg.rows;
 assert.equal(pkg.rows.length,3);
 assert.equal(parent[0],'Add');
 assert.equal(parent[idx('Quantity')],'');
 assert.equal(parent[idx('Start price')],'');
 assert.equal(parent[idx('Custom label (SKU)')],'');
 assert.equal(parent[idx('Category ID')],'123417');
 assert.equal(parent[idx('Category name')],'Wall Chargers');
 assert.equal(parent[idx('Payment profile name')],'Payment Policy');
 assert.equal(parent[idx('Condition ID')],'1000');
 assert.equal(parent[idx('Format')],'FixedPrice');
 assert.equal(parent[idx('Duration')],'GTC');
 assert.equal(parent[idx('Location')],'Fort Pierce, FL');
 assert.equal(parent[idx('C:Brand')],'Unbranded');
 assert.equal(parent[idx('C:MPN')],'000'+sample.itemId);
 for(const child of [a,b]){
  assert.equal(child[idx('Relationship')],'Variation');
  assert.equal(child[idx('Quantity')],'1');
  assert.equal(child[idx('Location')],'Fort Pierce, FL');
  assert.ok(child[idx('Custom label (SKU)')]);
  assert.equal(child[idx('C:MPN')],'');
 }
 assert.equal(a[idx('Start price')],'5.50');
 assert.equal(b[idx('Start price')],'7.25');
 const csv=T.toCsv(pkg);
 assert.ok(csv.includes('FixedPrice'));
 assert.ok(csv.includes('Payment Policy'));
 assert.ok(csv.includes('000'+sample.itemId));
});


test('MSKU combines both Unit Type and Item Length without inventing missing combinations',()=>{
 const msku={
  variationsMap:{
   '501':{binModel:{price:{textSpans:[{text:'US $7.07'}]}}},
   '502':{binModel:{price:{textSpans:[{text:'US $8.45'}]}}},
   '503':{binModel:{price:{textSpans:[{text:'US $9.99'}]}}}
  },
  menuItemMap:{
   '0':{valueId:10,displayName:'White A-C'},
   '1':{valueId:11,displayName:'White C-C'},
   '2':{valueId:21,displayName:'1.5m'},
   '3':{valueId:22,displayName:'2m'}
  },
  variationCombinations:{'0_2':'501','1_2':'502','1_3':'503'},
  selectMenus:[
   {displayLabel:'Unit Type',menuItemValueIds:[10,11]},
   {displayLabel:'Item Length',menuItemValueIds:[21,22]}
  ]
 };
 const doc={querySelectorAll(q){return q==='script:not([src])'?[{textContent:'window.__ebay={"MSKU":'+JSON.stringify(msku)+',"QUANTITY":{}}'}]:[]}};
 const found=V.inspectPage(doc,'https://www.ebay.com/itm/900003786126?var=502',7.07,'USD','900003786126');
 assert.equal(found.hasVariations,true);
 assert.equal(found.complete,true);
 assert.equal(found.dimensions.length,2);
 assert.equal(found.variants.length,3);
 assert.equal(found.variants.find(v=>v.selected).sourcePrice,8.45);
 assert.ok(found.variants.every(v=>v.specifics.length===2));
 assert.ok(found.variants.every(v=>!v.label.toLowerCase().includes('select')));
 const p=T.buildVariantPackage({itemId:'900003786126',title:'Cable',price:8.45,
  dimensions:found.dimensions,variants:found.variants.map(v=>({specifics:v.specifics,price:v.sourcePrice}))},'CA');
 const at=n=>p.headers.indexOf(n);
 assert.equal(p.rows.length,4);
 assert.equal(p.rows[1][at('Relationship details')],'Unit Type=White A-C|Item Length=1.5m');
 assert.equal(p.rows[3][at('Relationship details')],'Unit Type=White C-C|Item Length=2m');
});
test('MSKU includes only configured QTY 1pc and 2pcs combinations',()=>{
 const state={
  variationsMap:{'100':{binModel:{price:{textSpans:[{text:'US $5.62'}]}}},
   '101':{binModel:{price:{textSpans:[{text:'US $9.99'}]}}}},
  menuItemMap:{'0':{valueId:1,displayName:'1pc'},'1':{valueId:2,displayName:'2pcs'}},
  variationCombinations:{'0':'100','1':'101'},
  selectMenus:[{displayLabel:'QTY',menuItemValueIds:[1,2]}]
 };
 const doc={querySelectorAll(q){return q==='script:not([src])'?[{textContent:'{"MSKU":'+JSON.stringify(state)+'}'}]:[]}};
 const found=V.inspectPage(doc,'https://www.ebay.ca/itm/188154441118',5.62,'USD','188154441118');
 assert.equal(found.hasVariations,true);
 assert.equal(found.variants.length,2);
 assert.deepEqual(found.dimensions.map(d=>d.name),['QTY']);
 assert.deepEqual(found.variants.map(v=>v.sourcePrice),[5.62,9.99])
});
test('Selectselected is a placeholder and cannot become a variant',()=>{
 assert.equal(V.optionText('Selectselected'),'Select');
 assert.equal(V.isPlaceholder(V.optionText('Selectselected')),true);
 assert.equal(V.optionText('White A-Cselected'),'White A-C');
 assert.equal(V.optionText('2pcs Most popular'),'2pcs')
});
test('two eBay Skin selectors with only one populated list do not claim 3 complete variants',()=>{
 const choice=(s)=>({textContent:s,disabled:false,getAttribute(){return null},querySelector(){return{textContent:s}},classList:{contains(){return false}}});
 const createBox=(name,values)=>{
  const button={textContent:name+': Select',getAttribute(){return name+': Select'}};
  const options={querySelectorAll(){return values.map(choice)}};
  const group={querySelector(){return{textContent:name+':'}}};
  return {
   matches(s){return s==='.listbox-button'},
   querySelector(s){return s.startsWith('button[')?button:options},
   closest(){return group},parentElement:group
  }
 };
 const first=createBox('Unit Type',['Selectselected','White A-C','White C-C']);
 const second=createBox('Item Length',[]);
 const doc={querySelectorAll(q){
  if(q==='select'||q==='script:not([src])')return[];
  return q.includes('.listbox-button')?[first,second]:[]
 }};
 const p=V.inspectPage(doc,'https://www.ebay.com/itm/900003786126',7.07,'USD','900003786126');
 assert.equal(p.hasSelects,true);assert.equal(p.hasVariations,false);
 assert.ok(/Attributi multipli/i.test(p.reason))
});


test('fallback Skin QTY selector keeps 1pc and 2pcs and no Select row',()=>{
 const makePage=(label,values,selected)=>{
  const options=values.map(text=>({textContent:text,disabled:false,
   getAttribute(k){return k==='aria-selected'?(text===selected?'true':'false'):null},
   classList:{contains(){return false}},querySelector(){return{textContent:text}}}));
  const group={querySelector(){return{textContent:label+':'}}};
  const button={textContent:label+': '+selected,getAttribute(){return label+': '+selected}};
  const list={querySelectorAll(){return options}};
  const box={matches(s){return s==='.listbox-button'},querySelector(s){return s.startsWith('button[')?button:list},
    closest(){return group},parentElement:group};
  return{querySelectorAll(s){
   if(s==='select'||s==='script:not([src])')return[];
   return s.includes('.listbox-button')?[box]:[]
  }}
 };
 const item=V.inspectPage(makePage('QTY',['Select','1pc','2pcs Most popular'],'1pc'),
   'https://www.ebay.ca/itm/188154441118',5.62,'USD','188154441118');
 assert.equal(item.hasVariations,true);
 assert.deepEqual(item.variants.map(v=>v.label),['QTY: 1pc','QTY: 2pcs']);
});
test('fallback plural colors selector omits Selectselected and preserves four options',()=>{
 const options=['Selectselected','3 pcs blue','1 pc blue','1 pc white','3 pc white'];
 const list={querySelectorAll(){return options.map(text=>({textContent:text,disabled:false,
  getAttribute(){return null},classList:{contains(){return false}},querySelector(){return{textContent:text}}}))}};
 const button={textContent:'colors: 3 pcs blue',getAttribute(){return'colors: 3 pcs blue'}};
 const group={querySelector(){return{textContent:'colors:'}}};
 const box={matches(s){return s==='.listbox-button'},querySelector(s){return s.startsWith('button[')?button:list},
  closest(){return group},parentElement:group};
 const doc={querySelectorAll(s){return s==='select'||s==='script:not([src])'?[]:s.includes('.listbox-button')?[box]:[]}};
 const item=V.inspectPage(doc,'https://www.ebay.ca/itm/900025521069',9.99,'USD','900025521069');
 assert.equal(item.hasVariations,true);
 assert.equal(item.variants.length,4);
 assert.ok(item.variants.every(v=>!v.label.toLowerCase().includes('select')))
});


test('presentation normalizes colors and PC/PCS locally, preserving source key and price',()=>{
 const raw={
  dimensions:[{name:'colors',values:['3 pcs blue','1 pc white']}],
  variants:[{key:'colors=3 pcs blue',label:'colors: 3 pcs blue',
   specifics:[{name:'colors',value:'3 pcs blue'}],sourcePrice:9.99,sourceCurrency:'USD'},
   {key:'colors=1 pc white',label:'colors: 1 pc white',
   specifics:[{name:'colors',value:'1 pc white'}],sourcePrice:10.25,sourceCurrency:'USD'}]
 };
 const p=V.polishVariantPresentation(raw);
 assert.deepEqual(p.dimensions,[{name:'Color',values:['3 PCS Blue','1 PC White']}]);
 assert.deepEqual(p.variants.map(v=>v.label),['Color: 3 PCS Blue','Color: 1 PC White']);
 assert.deepEqual(p.variants.map(v=>v.key),raw.variants.map(v=>v.key));
 assert.deepEqual(p.variants.map(v=>v.sourcePrice),[9.99,10.25]);
 assert.equal(raw.variants[0].specifics[0].value,'3 pcs blue');
});
test('presentation splits UnitType and ItemLength but preserves technical names',()=>{
 const raw={
  dimensions:[{name:'UnitType',values:['white a-c','White C-C']},{name:'ItemLength',values:['1.5m']}],
  variants:[{key:'unittype=white a-c|itemlength=1.5m',
    specifics:[{name:'UnitType',value:'white a-c'},{name:'ItemLength',value:'1.5m'}],sourcePrice:7.07}]
 };
 const p=V.polishVariantPresentation(raw);
 assert.deepEqual(p.dimensions.map(x=>x.name),['Unit Type','Item Length']);
 assert.equal(p.variants[0].label,'Unit Type: White A-C · Item Length: 1.5m');
 assert.equal(p.variants[0].key,raw.variants[0].key);
 assert.equal(V.formatOptionValue('usb type-c 120W'),'USB Type-C 120W');
 assert.equal(V.formatDimensionName('plugTypes'),'Plug Type');
 assert.equal(V.formatDimensionName('QTY'),'QTY');
});
test('presentation refuses normalization if two eBay values would collide',()=>{
 const raw={dimensions:[{name:'colors',values:['blue','Blue']}],
  variants:[{key:'colors=blue',specifics:[{name:'colors',value:'blue'}],sourcePrice:4},
   {key:'colors=Blue',specifics:[{name:'colors',value:'Blue'}],sourcePrice:5}]};
 assert.equal(V.polishVariantPresentation(raw),raw);
});
test('polished names and values are written to the same eBay CSV rows',()=>{
 const raw={
  dimensions:[{name:'colors',values:['3 pcs blue','1 pc white']}],
  variants:[{key:'colors=3 pcs blue',specifics:[{name:'colors',value:'3 pcs blue'}],sourcePrice:9.99},
   {key:'colors=1 pc white',specifics:[{name:'colors',value:'1 pc white'}],sourcePrice:10.25}]
 };
 const p=V.polishVariantPresentation(raw);
 const pkg=T.buildVariantPackage({
  itemId:'900025521069',title:'Tape',price:9.99,dimensions:p.dimensions,
  variants:p.variants.map(v=>({specifics:v.specifics,price:v.sourcePrice}))
 },'CA');
 const ix=k=>pkg.headers.indexOf(k);
 assert.equal(pkg.rows[0][ix('Relationship details')],'Color=3 PCS Blue;1 PC White');
 assert.equal(pkg.rows[1][ix('Relationship details')],'Color=3 PCS Blue');
 assert.equal(pkg.rows[2][ix('Relationship details')],'Color=1 PC White');
 assert.deepEqual(pkg.rows.slice(1).map(row=>row[ix('Start price')]),['9.99','10.25']);
 assert.deepEqual(pkg.rows.slice(1).map(row=>row[ix('Quantity')]),['1','1']);
});

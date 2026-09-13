javascript:(async()=>{
'use strict';
const PATCH_ID='capitan-variants-csv-v18';
const STATE_KEY='capitan-sell-like-variants-state-v1';
const CLONE_KEY='capitan-sell-like-clone-data-v1';
const CATEGORY_TAXONOMY_ENDPOINT='https://script.google.com/macros/s/AKfycbxPSCamhPhs1fvkikx0KyJFk6wfJDCxC2XqaBbRqDIqOrLN9D_QibphbRB8QenovCY5/exec';
const CAPITAN_CATEGORY_NAME_BY_ID={"230":"Other Stuffed Animals","234":"Other Games","303":"Other Hand Tools","525":"Collections, Lots","566":"Openers","595":"Other Collectible Lighters","596":"Other Collectible Pipes","617":"DVDs & Blu-ray Discs","689":"Postal History","975":"Other Collectible Cookware","985":"1970-Now","1105":"Textbooks","1268":"Other Building Materials","1285":"Reptile Supplies","1447":"Other Christian Collectibles","1498":"Other Vehicle Electronics","1514":"Other Golf Accessories","2518":"Other Educational Toys","2535":"Other CCG Items","2540":"Electronic Games","2552":"Other","2576":"Playskool","2993":"Belts","2996":"Wallets","3099":"Other Glass Art Supplies","3115":"Other Sewing","3191":"Other Home Plumbing & Fixtures","3199":"Bookcases & Shelving","3243":"Other Pools & Spas","3271":"Equalizers","3295":"Planners & Organizers","3628":"Modern (1970-Now)","3768":"Office & Business","4662":"Capacitors","4843":"Tools & Supplies","7279":"Other Collectible Ballpoint","7284":"Mechanical","7288":"Inductors, Coils & Filters","7300":"Baits & Lures","7306":"Knives & Tools","8444":"Other","10905":"Swizzle/Stir Sticks","11226":"Operating Systems","11332":"Parts & Accessories","11498":"Boots","11507":"Underwear","11530":"Shapewear","11675":"Contemporary","11704":"Other Tools & Workshop Equipment","11776":"Vitamins & Minerals","11795":"Ink & Pads","11844":"Men's Shavers","11858":"Hair Dryers","11865":"Concealer","11872":"Manicure & Pedicure Tools & Kits","12040":"Audio/Video Remotes","13869":"Blacksmithing","14062":"Hat Boxes","14295":"Laptop Batteries","14936":"Car Speakers & Speaker Systems","14964":"Audio Cables & Interconnects","14990":"Home Speakers & Subwoofers","16037":"Flashlights","16038":"Camping Furniture","16102":"Candle Holders & Accessories","16493":"Dried Flowers","18928":"Ball Markers","19186":"3D Puzzles","19263":"Other Massage Equipment & Accs","19264":"Orthotics, Braces & Sleeves","19265":"Wheelchairs","19591":"Lighting Kits","19617":"Plants & Seedlings","20349":"Cases, Covers & Skins","20357":"Batteries","20441":"Shower Curtains","20445":"Bed Pillows","20473":"Cookies & Biscuits","20518":"Baskets, Pots, Window Boxes & Saucers","20542":"Lawn Sprinklers & Sprinkler Heads","20561":"Wall Clocks","20563":"Pillows","20564":"Fireplace & Stove Accessories","20573":"Door Mats & Floor Mats","20580":"Mirrors","20593":"Other Door Hardware","20604":"Other Flooring & Tiles","20608":"Trash Cans & Wastebaskets","20612":"Portable Fans","20613":"Space Heaters","20636":"Colanders, Strainers & Sifters","20649":"Cooking Utensils","20651":"Other","20653":"Food Storage Bags","20654":"Canisters & Jars","20655":"Food Storage Containers","20662":"Table Runners","20663":"Tablecloths","20664":"Towels & Dishcloths","20684":"Water Filters","20696":"Glassware & Drinkware","20702":"Night Lights","20705":"Lighting Parts","20725":"Barbecue Tools","20736":"Toys","20761":"Clamps & Vises","20763":"Hammers & Mallets","20838":"Compound","21205":"Moisturizers","22656":"Coat & Hat Racks","22671":"Stands & Hangers","22689":"Lights & Reflectors","25264":"Cup Grinding Wheels","25326":"Typewriters & Word Processors","25345":"Binders & Supplies","25350":"Forms & Record Keeping","25621":"Other RV, Trailer & Camper Parts & Accessories","25815":"Bedding Accessories","25846":"Other Bakeware & Ovenware","26217":"Screws & Bolts","26331":"Darts-Soft Tips","26448":"Deck & Cabin Hardware","27386":"Graphics/Video Cards","27552":"Chafing Dishes & Warming Trays","28109":"Art Pens & Markers","28137":"Eyelets","28162":"Fabric","28176":"Walkers & Canes","29511":"Ornaments & Statues","29514":"Plant Stands","29522":"Other Watering Equipment","29524":"Measuring Tapes & Rulers","29527":"Wrench Sets","29946":"Microphones & Wireless Systems","30059":"Lens Adapters, Mounts & Tubes","30097":"Other Tripods & Supports","30506":"Air Compressors","30541":"Nails","31412":"Hair Color","31416":"Special Purpose Glasses","31474":"Disposable Gloves","31510":"Laptop Power Adapters/Chargers","31587":"Plaques & Signs","31732":"Buttons","31770":"Electric Toothbrushes","32834":"Video Cables & Interconnects","32884":"Cookie Cutters","33050":"Capos","33082":"Generators","33089":"Tool Boxes","33543":"A/C Compressors & Clutches","33557":"Air Intake & Fuel Sensors","33647":"Liftgates","33654":"Body Moldings & Trims","33655":"Truck Bed Accessories","33716":"Rear Light Assemblies","33963":"Keyboards & Keypads","35190":"Mounts & Holders","35625":"Other Hand Tools","35682":"Cans & Buckets","36024":"Hooks & Hangers","36120":"Tent & Canopy Accessories","36137":"Pedals","36234":"Putting Greens & Aids","36407":"Rollers & Curlers","36449":"Massagers","36453":"Massage Oils & Lotions","37871":"Figurines","38181":"Tea & Infusions","38204":"Tables","38220":"Decorative Logs, Stone & Glass","38225":"Display Easels","38229":"String Lights","39476":"Holders","39646":"United States, Country Flags","40029":"Federal Reserve Notes","40088":"Brightening Creams","40605":"Seeds & Bulbs","40659":"Other Shoe Care & Repair","40856":"Contemporary Chess","41199":"Feathers","41200":"Styrofoam Forms","41423":"Necks","41431":"Strings","41434":"Tuning Pegs","41456":"Sticks, Brushes & Mallets","41947":"Drill Chucks","41973":"Cabinet Hinges","42132":"Pumps","42146":"Vacuum Cleaner Parts","42226":"Chainsaws","42255":"Screwdrivers & Nutdrivers","42258":"Hex Keys & Hex Wrenches","42266":"Buffers & Polishers","42335":"Cables & Housing","42362":"Tool Bags, Belts & Pouches","42425":"Other Mobile Accessories","42632":"Other Measuring & Layout Tools","42633":"Other Tool Storage","42904":"Hardware Washers","42905":"Other Fasteners & Hardware","42912":"Other HVAC & Refrigeration","43420":"Can Openers (Manual)","43421":"Cooking Thermometers","43448":"Memory Card Readers & Adapters","43504":"Storage Bags","43506":"Shoe Organizers","43509":"Air Filters","43516":"Laundry Bags","43533":"Flags","43536":"Flag Poles & Parts","43566":"Cooking Appliance Parts","43593":"Jacks, Stands & Sawhorses","43616":"Gloves & Pads","43984":"Winches","43991":"Precision & Measuring Tools","44077":"Pedometers","44932":"USB Cables, Hubs & Adapters","44996":"Other Home Networking","45258":"Wallets","45515":"Curtains & Drapes","46283":"Racks & Holders","46289":"Cages","46290":"Feeders","46292":"Incubators","46310":"Filters","46314":"Lights","46413":"Welding & Soldering Tools","46435":"Hose Reels & Storage","46527":"Beekeeping","46529":"Fencing","46708":"Cash Drawers & Boxes","46733":"General Accessories","46782":"Candles","47067":"Guitar Building & Luthier Supplies","47324":"Golf Club Grips","47779":"Keyboard & Mouse Bundles","48626":"Portable Stereos & Boomboxes","48638":"Security Cameras","48656":"TV Stands & Mounts","50380":"Punches","50382":"Drill Bits","50388":"Pressure Washers","50419":"Kitchen Scales","50549":"Connectors & Terminals","50551":"Fuses & Fuse Holders","50602":"Single Use Batteries","50814":"Carabiners & Hardware","50816":"Ropes, Cords & Slings","50876":"Nets, Cages & Mats","51071":"USB Flash Drives","52357":"Bags","52365":"Hats","52373":"Key Chains, Rings & Cases","52473":"Audio Media Accessories","52505":"Game & Trail Cameras","52506":"Scents & Scent Eliminators","52510":"Scope Mounts & Accessories","53059":"Animal Health & Veterinary","53152":"Ear Plugs","53296":"Controls & Circuit Boards","53298":"HVAC & Refrigeration Leak Detectors","54235":"Chairs","55808":"Total Stations & Accessories","56615":"Servos & Servo Accessories","57019":"Fire Extinguishers","57049":"Paper Cutters & Trimmers","57111":"Supplies & Tools","57586":"Tattoo Inks","58166":"Pushbutton Switches","58167":"Rocker Switches","58198":"Other Abrasives","58235":"Inspection Gages","58540":"Screen Protectors","60594":"Display Cases","61312":"Remote Controls","62134":"Jump Ropes","62172":"Gloves & Mittens","63034":"Feeders","63116":"Feeding & Watering","63755":"$100","64035":"Ethernet Cables (RJ-45/8P8C)","64619":"Record Player, Turntable Parts","64657":"Parts & Accessories","65965":"Insect Nets","66723":"Toilet Brushes & Holders","66739":"Door Hinges","66762":"Beds","66799":"Shutters","66987":"Hand Crimpers & Strippers","67095":"Shredders","67421":"Standard Toothbrushes","67779":"Power Strips & Surge Protectors","68407":"RC Tools & Sets","69221":"Vacuum Sealers","71178":"Wooden Pieces","71278":"String Trimmer Parts","71420":"Plastic Welders & Sealers","71495":"Dispensers & Accessories","72665":"Rod Rests & Holders","72874":"Glucose Monitors","73135":"Electrical Plugs","73138":"Multiple Conductor Cable","73181":"Chalk","73362":"Tracking Devices","73467":"Other Decorative Collectibles","73470":"Shopping Cart Covers","73500":"Frames","73835":"Cassette Adapters","73836":"Transmitters","73839":"iPods & MP3 Players","73942":"Hearing Protection","73962":"Smithing Equipment","74723":"Steering Wheels & Knobs","74941":"Drive Cables & Adapters","74990":"Bath Brushes & Sponges","75034":"Bandages, Gauze & Dressings","75072":"Blood Pressure Monitoring","75185":"Ball & Cue Racks","75188":"Cue Tips","75207":"Push-Pull Golf Carts","75389":"Relays & Sensors","75593":"Rain Gauges","75664":"Bonsai Tools","75669":"Garden Kneelers, Cushions & Seats","75670":"Moisture & pH Meters","75671":"Wheelbarrows, Carts & Wagons","77641":"Pumps (Water)","78089":"Eyebrow Liner & Definition","79621":"Dehumidifiers","79643":"Alarm Clocks & Clock Radios","79649":"Log Holders & Carriers","79654":"Frames","79656":"Steam Cleaners","79676":"Pool Liners","79682":"Patio Chairs","79683":"Patio Furniture Cushions & Pads","79686":"Barbecue & Grill Covers","79846":"Other Multipurpose Batteries","80077":"Headsets","81241":"Washing Lines","81247":"Loaf Pans","81458":"Nets","82565":"Waxing Supplies","83053":"Training Aids","85857":"Slides","85899":"Garage Door Remotes","85915":"Chainsaw Parts","85917":"Tie Downs & Straps","87089":"Accessories","88758":"Multipurpose AC to DC Adapters","88759":"Outlet Adapters & Converters","90634":"Umbrellas","90865":"Scorecards & Holders","92090":"Welding Helmets","94939":"Wall & Ceiling Lights","94940":"Landscape & Walkway Lights","95079":"Insulated Food Delivery Bags","95115":"1000","95135":"Horns & Bells","96954":"Portable AM/FM Radios","97126":"Other Heavy Equipment Parts & Accessories","98624":"Wristwatch Bands","98845":"Frying & Grill Pans","98847":"Pan Sets","98853":"Mortar & Pestles","99565":"Coffee, Tea & Espresso Parts","99697":"Washer & Dryer Parts","100227":"Developmental Baby Toys","100351":"Air Pumps","100355":"Air Stones","100411":"Litter Boxes","100417":"Food & Treats","101428":"Lunch Containers","101975":"Power Supplies","102521":"Cards Decks","103459":"Curtain Rods & Hardware","106981":"Track & Field","106984":"Headlamps","107876":"Nail Art Tools","107894":"Cases, Bags & Covers","109420":"Price Tags","109433":"Pegboards & Gridwalls","109475":"Adhesive Tapes","109492":"Shock Cords & Bungees","109740":"Shipping & Moving Boxes","111607":"Pressure Switches","111694":"Audio Docks & Mini Speakers","112529":"Headphones","112567":"Ladders","112581":"Lamps","113753":"Staples","115280":"Golf Clubs","115772":"Windmills & Wind Spinners","115948":"Non-programmable Thermostats","115949":"Programmable Thermostats","116022":"String Lights, Fairy Lights","116026":"Dishwasher Parts","116118":"Bibles Covers & Accessories","116183":"Eyeglass Cases & Storage","116388":"Electronic Fences","116392":"Pooper Scooper & Bags","116412":"Pool Filters","116643":"Glass Cutters","116743":"Clothes Hangers","116852":"Power Cables & Connectors","116880":"Wall Fixtures","117000":"Power Regulators & Converters","117027":"Baby Locks & Latches","117039":"Tools & Repair Kits","117398":"Boxes & Storage","117503":"Chandeliers & Ceiling Fixtures","117514":"Magnetic Sheets & Supplies","118863":"Pebbles, Stones & Step Stones","119101":"Other Pressure Washer Parts & Accessories","119683":"Fertilizers","120869":"Book Lights","122694":"Craft Tape","122838":"Other Saw Blades","122909":"Exhaust Fans & Ventilators","122932":"Rice Cookers","122962":"Straps & Charms","123417":"Chargers & Cradles","123422":"Cables & Adapters","123474":"Bells & Horns","123475":"Lubrication & Cleaning","124825":"TIG Welders","124980":"Weather Stripping","129138":"Heat Shrink Tubing & Sleeves","131487":"Computer Case Fans","134728":"Measuring Cups & Spoons","134764":"Outlet Covers","134792":"Eye Care","136814":"Cake Pans","137862":"Hand Grippers","137864":"Barbells & Attachments","137865":"Dumbbells","139844":"Shaver Accessories","139950":"Railings","139971":"Video Game Consoles","145933":"Magnets","145992":"Water Slides","146004":"Card Games-Vintage","146243":"House Training Pads","146247":"Leashes & Head Collars","146545":"Other Scrapbook Embellishments","148728":"Pedals","148983":"Cleaning & Maintenance","150049":"Jewelry Clasps & Hooks","150059":"Jewelry Making Cord & Wire","151604":"Hoses","158840":"Monitor/AV Cables & Adapters","158919":"Support & Protective Gear","158925":"Push Up Stands","158969":"Protective Gear","159048":"Other Outdoor Sports","159063":"Skate Parts & Tools","159081":"Other Backyard Games","159131":"Nets","159684":"Sprayers","159789":"Shaver Parts","159874":"Reacher Grabbers","159903":"Microwave Parts","159930":"Leaf Blower & Vacuum Parts","160736":"Mixed Lots","162057":"Albums","162078":"Resin Craft Molds & Supplies","162184":"Corner & Edge Cushions","162480":"Other Camera & Photo Accs","162933":"Drawer Pulls","163769":"Replacement Parts & Tools","164796":"Locks","164800":"Luggage Tags","166030":"Armbands","166675":"Business Signs","166724":"Air Fresheners","168105":"Marine Audio","168135":"Impact Wrenches","168867":"Lanterns","168875":"Accessories & Cases","169284":"Insoles","169285":"ID & Document Holders","169291":"Women's Bags & Handbags","170083":"Memory (RAM)","170098":"Greeting Cards & Invitations","171135":"Display Cases & Stands","171536":"Crutches","171821":"Headsets","171833":"Replacement Parts & Tools","171837":"Screen Protectors","172514":"Camera Tools & Repair Kits","175711":"DVD & Blu-ray Players","175720":"Satellite Dishes","175731":"Marine/Air Band Radio Antennas","175750":"Blankets & Throws","175754":"Slipcovers","175758":"Beds & Bed Frames","175837":"Other Consumer Electronics","176937":"Ceiling Fans","176973":"Cases, Covers, Keyboard Folios","176977":"Mounts, Stands & Holders","177006":"Vacuum Flasks & Mugs","177015":"Ice Cubes, Trays & Molds","177018":"Barbecue & Grill Replacement Parts","177066":"Cupcake & Muffin Pans","177124":"Toilet Paper Holders & Storage","177653":"Coins","177660":"Serum & Oils","177764":"Eye Treatments & Masks","177767":"Facial Cleansing Devices","177789":"Dishes, Feeders & Fountains","177808":"Brakes","177816":"Handlebar Grips, Tape & Pads","177828":"Tires","177829":"Tubes","177831":"Bicycles","177837":"Kickstands","177838":"Saddle Covers & Seat Covers","177845":"Puncture Repair","177846":"Tools","177863":"Shoe Covers","178027":"Other Lighting & Lamps","178052":"Canning Supplies","178983":"Shovels","178984":"Garden Sprayers","178989":"Grow Light Kits","178990":"Growing Media","178991":"Hydroponic Systems","179281":"Golf Equipment Tools & Supplies","179429":"Paint Tools & Supplies","179509":"Funnels, Oil Pans & Mats","179663":"Pliers","179686":"Jigs & Templates","179690":"Furniture Parts","179813":"Home Gym Attachments","180114":"Other Window Accessories","180349":"Contemporary Manufacture","180933":"Squeezable Stress Relievers","180952":"Cold & Hot Packs & Wraps","180953":"Electric Heating Pads","180973":"Other Garage Door Equipment","180995":"Gazebos & Pergolas","181000":"Plant Labels","181001":"Plant Ties & Supports","181013":"Connectors, Valves & Accessories","181015":"Spray Guns, Hose Nozzles & Wands","181035":"Ultrasonic Pest Repellers","181039":"Insect Traps & Baits","181040":"Insect Zappers","181045":"Animal Traps & Cages","181046":"Protective Netting & Mesh","181059":"Pool Water Testing & Kits","181062":"Handheld Pool Brushes & Nets","181063":"Pool Cleaners & Vacuums","181123":"Pond Lighting","181332":"Other Baseball Training Aids","181380":"Waist Packs & Bags","181382":"Camping Ice Boxes & Coolers","181396":"Portable Showers","181397":"Portable Toilets","181695":"Solid State Relays","181757":"Pulleys & Sheaves","181887":"LCD Display Modules","181913":"Potentiometers","181984":"Infrared & Laser Thermometers","182060":"Canes & Walking Sticks","182097":"Power Cables & Connectors","182130":"Wheelchair Parts","182135":"Seat & Posture Cushions","182173":"Other Accessories","182177":"Lighting & Lamps","182179":"Mounts & Stands","182213":"Other RC Parts & Accs","182926":"Metal & Alloy Round Rods","182928":"Metal Sheets & Flat Stock","183066":"3D Printer Parts","183069":"Smartphone VR Headsets","183073":"Other Virtual Reality Accs","183393":"Security & Floodlights","183437":"Card Sleeves & Bags","183438":"Card Toploaders & Holders","183439":"Albums, Binders & Pages","183440":"Card Storage Boxes & Dividers","183462":"CCG Deck Boxes, Storage Cases & Dividers","183465":"CCG Albums, Binders & Pages","183894":"Safety Cones, Posts & Barriers","183950":"Hose & Cable Clamps","183988":"Air Pressure Regulators","184015":"Other Fittings & Adapters","184038":"Hose & Tubing","184079":"Liquid Glues & Cements","184148":"Other Valves & Manifolds","184199":"Other Cranes & Hoists","184210":"Lifting Hooks","184214":"Lifting Rope & Cable Clips","184226":"Other Lifting Parts & Rigging","184267":"Other Envelopes & Mailers","184271":"Address & Shipping Labels","184315":"Caulks & Sealants","184333":"Other Extractor Parts & Accessories","184580":"CPAP Parts","184664":"French Presses","184666":"Refrigerator & Freezer Parts","185033":"Fryers","185108":"Central Air Conditioners","185160":"Dental Instruments","257835":"Vials","257894":"Casters","257901":"Footrests","257906":"Ballpoint & Rollerball Pens","257918":"Pegboard & Gridwall Hooks","257921":"Signal Generators","257924":"Voltage Detectors","257979":"Mixes","258018":"Gums & Breath Mints","258022":"Chocolate Sweets & Assortments","258040":"Building Toy Complete Sets & Packs","258192":"Chucking Reamers","258213":"Pipe Taps","258302":"Soldering Guns & Irons","258303":"Welding Rods","258644":"Shelving Parts & Accessories","258672":"Ice Machine Parts & Accessories","259203":"Paint Rollers","259224":"Mailboxes & Slots","259344":"Cleaning Brushes","259493":"Extension Cords","259621":"Cleaning Products","259667":"Seals & O-Rings","259675":"Three Point Hitch Parts, Hitches & Drawbars","259678":"Tire Accessories","259858":"Valves","259860":"Toilet Parts & Attachments","260156":"Rug & Carpet Tools","260187":"Sanding Discs","260196":"Air Hoses","260215":"Reciprocating Saw Blades","260310":"Electric Egg Cookers","260494":"Water Heater Parts","260496":"Other Heating, Cooling & Air","260505":"Tankless Water Heaters","260554":"Drain Stoppers & Strainers","260557":"Bathroom Sink Faucets","260742":"Water Bottle Cages","260775":"Acupuncture Devices","260823":"Fuses & Links","260828":"Switch Accessories","260835":"Wire & Cable Connectors","260923":"Lawn Mower Parts","260937":"Bird Feeders","260951":"Mechanical Repellents & Deterrents","260952":"Grow Pots, Net Pots & Seed Starting Trays","261010":"Umbrella Stands","261068":"Action Figures","261186":"Books","261328":"Trading Card Singles","261604":"Cuckoo & Black Forest Clocks","261609":"Replacement Parts & Tools","261688":"Canisters & Jars","261986":"Body Jewelry","261987":"Bracelets & Charms","262017":"Jewelry Boxes, Organizers & Packaging","262020":"Jewelry Tools & Workbenches","262189":"Center & Overhead Console Parts","262203":"Additional Storage & Organisers","262348":"Clothing & Accessories","262977":"Comforters & Sets"};
const LISTINGS_TEMPLATE_HEADERS=[
'*Action(SiteID=US|Country=US|Currency=USD|Version=1193)','Custom label (SKU)','Category ID','Category name','CATEGORY_SELECT','Title','Schedule Time','Item photo URL','Description','Buy It Now price','Start price','Relationship','Relationship details','Quantity','P:UPC','Shipping profile name','Return profile name','Payment profile name','Condition ID','Format','Duration','Location','C:Compatible Brand','C:Compatible Model','C:Features','C:Cord Type','C:Included Accessories','C:Charge Time','C:For','C:Form','C:Number in Pack','C:Scent','C:Suitable For','C:Power Source','C:Game','C:MPN','C:Brand','C:Type','C:Color','C:Item Height','C:Item Length','C:Item Width','C:Stove Type Compatibility','C:Model','C:Dosage','C:Expiration Date','C:Product','ASPECTS_REQUIRED_STATUS','ASPECTS_REQUIRED_FIELDS','IMG_WRITE_STATUS ','P:EPID','VideoID','C:EPA Registration Number','TakeBackPolicyID','Regional TakeBackPolicies','ProductCompliancePolicyID','Regional ProductCompliancePolicies','Hazmat Pictograms','Hazmat SignalWord','Hazmat Statements','Hazmat Component','EcoParticipationFee','Product Safety Pictograms','Product Safety Statements','Product Safety Component','Regulatory Document Ids','Manufacturer Name','Manufacturer AddressLine1','Manufacturer AddressLine2','Manufacturer City','Manufacturer Country','Manufacturer PostalCode','Manufacturer StateOrProvince','Manufacturer Phone','Manufacturer Email','Manufacturer ContactURL','Responsible Person 1','Responsible Person 1 Type','Responsible Person 1 AddressLine1','Responsible Person 1 AddressLine2','Responsible Person 1 City','Responsible Person 1 Country','Responsible Person 1 PostalCode','Responsible Person 1 StateOrProvince','Responsible Person 1 Phone','Responsible Person 1 Email','Responsible Person 1 ContactURL','C:Smart Home Compatibility','C:Smart Home Protocol','Shipping service 1 option','Shipping service 1 cost','Shipping service 1 priority','Shipping service 2 option','Shipping service 2 cost','Shipping service 2 priority','Max dispatch time','Returns accepted option','Returns within option','Refund option','Return shipping cost paid by','Best Offer Enabled','Best Offer Auto Accept Price','Minimum Best Offer Price','Immediate pay required','C:Style','C: Size','C:Department','C:Body Area','C:Material','C:Part Type','C:Number of Shelves','C:Ink Color','C:For Instrument','C:Insect Repellent Treated','C:Bait Type','C:Connectivity','C:Colour','C:Manufacturer Part Number','C:Author','C:Book Title','C:Language','C:Exterior Material','C:Exterior Colour','C:Size','C:Chipset Manufacturer','C:Chipset/GPU Model','C:Compatible Mattress Size','C:Frame Material','C:Playable Media Format','C:Set','C:Golf Club Type','C:Handedness','C:Format','C:Movie/TV Title','C:Shade','C:Artist','C:Release Title','C:Installation'
];
const LISTINGS_INTERNAL_HEADERS=new Set(['CATEGORY_SELECT','ASPECTS_REQUIRED_STATUS','ASPECTS_REQUIRED_FIELDS','IMG_WRITE_STATUS','VARIATION_VALIDATION_STATUS','VARIATION_VALIDATION_DETAILS']);
function listingsExportHeaders(){return LISTINGS_TEMPLATE_HEADERS.filter(h=>!LISTINGS_INTERNAL_HEADERS.has(clean(h)))}

if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
const escCsv=v=>{const s=String(v==null?'':v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function variantState(){return window.__capitanSellLikeVariants||readJson(STATE_KEY)}
function cloneData(){return window.__capitanSellLikeCloneData||readJson(CLONE_KEY)}
function setStatus(msg,bad=false){
  const s=document.querySelector('#capitan-variants-auto-status');
  if(s){s.textContent=msg;s.style.color=bad?'#b3261e':'#137333'}
}
function findControlByLabel(re){
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent||'');
    if(!re.test(t))continue;
    let c=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,select,[role="combobox"],button');
    if(c)return c;
    let p=l.parentElement;
    for(let i=0;i<4&&p;i++,p=p.parentElement){c=p.querySelector('input,textarea,select,[role="combobox"],button');if(c)return c}
  }
  return null
}
function normalizePolicyName(v){return String(v==null?'':v)
  .replace(/[\u200B-\u200D\uFEFF]/g,'')
  .replace(/\u00A0/g,' ')
  .replace(/\s*[\(\[][^\)\]]*listings?[^\)\]]*[\)\]]\s*/ig,' ')
  .replace(/\s+/g,' ')
  .trim()}
function controlValue(el){
  if(!el)return'';
  if(el.tagName==='SELECT'){const o=el.options&&el.options[el.selectedIndex];return clean(o&&o.textContent||el.value)}
  if('value' in el&&clean(el.value))return clean(el.value);
  return clean(el.innerText||el.textContent||el.getAttribute&&el.getAttribute('aria-label')||'')
}
function currentTitle(){
  const d=cloneData()||{};
  const source=clean(d.title).slice(0,80);
  if(source)return source;
  const input=[...document.querySelectorAll('input[type="text"],textarea')]
    .find(x=>/^title$/i.test(clean(x.getAttribute('aria-label')||x.name||x.id||'')));
  return clean(input&&input.value).slice(0,80)
}
function currentDescription(){
  const d=cloneData()||{};
  const prepared=String(d.descriptionHtml||'').trim();
  if(prepared)return prepared;

  const candidates=[...document.querySelectorAll('textarea,[contenteditable="true"]')];
  const descCandidates=candidates.filter(e=>{
    const meta=clean([e.name,e.id,e.placeholder,e.getAttribute&&e.getAttribute('aria-label')].join(' '));
    if(/\bdescription\b/i.test(meta))return true;
    let p=e,depth=0;
    while(p&&depth<6){
      const h=p.querySelector&&p.querySelector('h2,h3,legend,label');
      if(/^description$/i.test(clean(h&&h.textContent||'')))return true;
      p=p.parentElement;depth++
    }
    return false
  });
  for(const e of descCandidates){
    if(e.matches('[contenteditable="true"]')){const html=String(e.innerHTML||'').trim();if(html&&html!=='<br>')return html}
    else{const v=String(e.value||'').trim();if(v)return v}
  }
  return''
}
function currentConditionId(){
  const direct=findControlByLabel(/condition/i);
  if(direct){
    if(direct.tagName==='SELECT'){const o=direct.options&&direct.options[direct.selectedIndex];for(const v of [o&&o.value,direct.value,o&&o.getAttribute&&o.getAttribute('data-condition-id')]){if(/^\d{3,5}$/.test(clean(v)))return clean(v)}}
    for(const v of [direct.value,direct.getAttribute&&direct.getAttribute('data-condition-id'),direct.getAttribute&&direct.getAttribute('data-value')]){if(/^\d{3,5}$/.test(clean(v)))return clean(v)}
  }
  for(const e of document.querySelectorAll('[data-condition-id],[data-testid*="condition"],input,select,button')){
    const meta=clean([e.name,e.id,e.getAttribute&&e.getAttribute('aria-label'),e.getAttribute&&e.getAttribute('data-testid')].join(' '));
    if(!/condition/i.test(meta)&&!(e.hasAttribute&&e.hasAttribute('data-condition-id')))continue;
    for(const v of [e.getAttribute&&e.getAttribute('data-condition-id'),e.value,e.getAttribute&&e.getAttribute('data-value')]){if(/^\d{3,5}$/.test(clean(v)))return clean(v)}
  }
  return '1000'
}
function currentConditionText(){
  const labels=[...document.querySelectorAll('label,div,span,h2,h3')]
    .filter(e=>visible(e)&&/^item condition$/i.test(clean(e.innerText||e.textContent||'')));
  for(const l of labels){
    let p=l.parentElement;
    for(let depth=0;depth<4&&p;depth++,p=p.parentElement){
      const lines=String(p.innerText||p.textContent||'').split(/\r?\n/).map(clean).filter(Boolean)
        .filter(v=>!/^item condition$/i.test(v));
      const v=lines.find(x=>/new with tags|new without tags|new|used|open box|refurbished|pre-owned/i.test(x));
      if(v)return v
    }
  }
  const d=cloneData()||{};
  for(const v of [d.conditionLabel,d.conditionText,d.condition]){
    const x=clean(v);if(x)return x
  }
  return 'New'
}
function currentCategoryId(){
  const d=cloneData()||{},st=variantState()||{},vd=st.data||{};
  for(const v of [d.categoryId,d.categoryID,vd.categoryId,vd.categoryID]){
    if(/^\d{2,12}$/.test(clean(v)))return clean(v)
  }
  for(const e of document.querySelectorAll('[data-category-id],[data-categoryid]')){
    for(const v of [e.getAttribute('data-category-id'),e.getAttribute('data-categoryid')]){
      if(/^\d{2,12}$/.test(clean(v)))return clean(v)
    }
  }
  const categoryHeads=[...document.querySelectorAll('h2,h3,h4,div,section')].filter(e=>/^item category$/i.test(clean(e.innerText||e.textContent||'')));
  for(const h of categoryHeads){
    let p=h.parentElement;
    for(let depth=0;depth<4&&p;depth++,p=p.parentElement){
      for(const a of p.querySelectorAll('a[href]')){
        const href=String(a.href||'');
        const m=href.match(/(?:categoryId=|cat=|\/b\/[^/?#]+\/)(\d{2,12})(?:[/?#&]|$)/i);
        if(m)return m[1]
      }
    }
  }
  const html=String(document.documentElement&&document.documentElement.innerHTML||'');
  const m=html.match(/["']category(?:Id|ID)["']\s*[:=]\s*["']?(\d{2,12})/);
  return m?m[1]:''
}
function taxonomyCategoryLookup(categoryId){
  categoryId=clean(categoryId);
  if(!/^\d{1,12}$/.test(categoryId))return Promise.reject(Error('Category ID non valido per Taxonomy'));
  return new Promise((resolve,reject)=>{
    const cb='__capitanTaxonomyCategoryCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const s=document.createElement('script');
    const timer=setTimeout(()=>done(Error('Timeout eBay Taxonomy')),15000);
    function done(err,val){
      clearTimeout(timer);
      try{delete window[cb]}catch(_){window[cb]=undefined}
      s.remove();
      err?reject(err):resolve(val)
    }
    window[cb]=v=>done(null,v);
    s.onerror=()=>done(Error('Endpoint eBay Taxonomy non raggiungibile'));
    const q=new URLSearchParams({
      action:'sell_like_category_lookup',
      categoryId:categoryId,
      marketplaceId:'EBAY_US',
      callback:cb,
      _:String(Date.now())
    });
    s.src=CATEGORY_TAXONOMY_ENDPOINT+'?'+q.toString();
    document.head.appendChild(s)
  })
}

function currentCategoryName(){
  const taxonomy=clean(window.__capitanTaxonomyCategoryName||'');
  if(taxonomy)return taxonomy;

  const id=currentCategoryId();
  if(id&&CAPITAN_CATEGORY_NAME_BY_ID[id]){
    return clean(CAPITAN_CATEGORY_NAME_BY_ID[id])
  }

  const d=cloneData()||{},st=variantState()||{},vd=st.data||{};
  const imported=clean(d.categoryName||vd.categoryName||'');
  if(imported){
    const parts=imported.split(/\s*(?:\||:|>)\s*/).map(clean).filter(Boolean);
    const leaf=parts.length?parts[parts.length-1]:imported;
    if(leaf&&!/learn more|opens in a new window|sales tax|^edit$|feedback/i.test(leaf))return leaf
  }
  return''
}
function policyName(kind){
  const label={shipping:'Shipping policy',return:'Return policy',payment:'Payment policy'}[kind];

  if(kind==='return'){
    const pageText=String(document.body&&document.body.innerText||'');
    const m=pageText.match(/(?:^|\n)\s*Return policy\s*:\s*([^\n]+)/i);
    if(m){
      const v=normalizePolicyName(m[1]);
      if(v)return v
    }
  }

  const normalizeCandidate=raw=>{
    raw=clean(raw);
    if(!raw)return'';
    const count=(raw.match(/\b\d+\s+listings?\b/ig)||[]).length;
    if(count>1)return'';
    const v=normalizePolicyName(raw);
    if(!v||v.length>180)return'';
    if(/^(edit|change|select|add|help|done|\.\.\.)$/i.test(v))return'';
    return v
  };

  // 1) eBay page text: the selected value is immediately after the exact field label.
  let bodyText='';
  try{
    const copy=document.body.cloneNode(true);
    const panel=copy.querySelector('#capitan-sell-like-clone');if(panel)panel.remove();
    copy.querySelectorAll('script,style,noscript').forEach(x=>x.remove());
    bodyText=String(copy.innerText||copy.textContent||'')
  }catch(_){bodyText=String(document.body&&document.body.innerText||'')}

  const lines=bodyText.split(/\r?\n/).map(clean).filter(Boolean);
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(line.toLowerCase()===label.toLowerCase()){
      for(let j=i+1;j<Math.min(lines.length,i+5);j++){
        if(j>i+1&&/^(shipping policy|return policy|payment policy)$/i.test(lines[j]))break;
        if(/\b\d+\s+listings?\b/i.test(lines[j])){
          const v=normalizeCandidate(lines[j]);
          if(v)return v
        }
      }
    }
    if(line.toLowerCase().startsWith(label.toLowerCase()+' ')){
      const remainder=clean(line.slice(label.length));
      if(/\b\d+\s+listings?\b/i.test(remainder)){
        const v=normalizeCandidate(remainder);
        if(v)return v
      }
    }
  }

  // 2) Exact DOM label -> nearest selected control.
  const labels=[...document.querySelectorAll('label,div,span,p')]
    .filter(x=>clean(x.innerText||x.textContent||'').toLowerCase()===label.toLowerCase());

  for(const l of labels){
    if(l.tagName==='LABEL'&&l.htmlFor){
      const linked=document.getElementById(l.htmlFor);
      const raw=controlValue(linked);
      if(raw){const v=normalizeCandidate(raw);if(v)return v}
    }
    let p=l.parentElement;
    for(let depth=0;depth<3&&p;depth++,p=p.parentElement){
      const controls=[...p.querySelectorAll('input,textarea,select,[role="combobox"],button,[role="button"]')]
        .filter(e=>visible(e));
      const values=controls.map(e=>controlValue(e)).filter(v=>/\b\d+\s+listings?\b/i.test(v));
      for(const raw of values){
        const v=normalizeCandidate(raw);
        if(v)return v
      }
    }
  }

  // 3) Safe classification fallback among single selected policy strings.
  const candidates=[...new Set(lines.filter(x=>(x.match(/\b\d+\s+listings?\b/ig)||[]).length===1))];
  for(const raw of candidates){
    const norm=normalizeCandidate(raw);
    if(!norm)continue;
    if(kind==='payment'&&(/payment/i.test(raw)||norm.toLowerCase()==='payment policy'))return norm;
    if(kind==='return'&&/return|refund/i.test(raw))return norm;
    if(kind==='shipping'&&/shipping|business\s+days?|economy|standard|expedited|fedex|ups|usps/i.test(raw))return norm
  }
  return''
}
function currentSkuBase(){
  let value='';
  for(const l of document.querySelectorAll('label')){
    if(!/custom\s*label|sku/i.test(clean(l.innerText||l.textContent||'')))continue;
    let e=l.htmlFor?document.getElementById(l.htmlFor):null;
    if(!e&&l.parentElement)e=l.parentElement.querySelector('input[type="text"],input:not([type])');
    if(e&&/^(text|search|)$/i.test(e.type||'')){value=clean(e.value);if(value)break}
  }
  if(!value||/^(on|off|true|false|yes|no)$/i.test(value)){
    const st=variantState()||{},d=cloneData()||{};
    value='EBAY-'+clean(st.data&&st.data.itemId||d.itemId||window.__capitanSellLikeSourceItemId||'SLV')
  }
  return value.replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,36)
}
function relationshipParent(dims){
  return dims.map(d=>clean(d.name)+'='+(d.values||[]).map(clean).filter(Boolean).join(';')).join('|')
}
function relationshipChild(v){
  return (v.specifics||[]).map(s=>clean(s.name)+'='+clean(s.value)).filter(x=>!/=$/.test(x)).join('|')
}
function firstSpecificValue(v,name){
  const low=clean(name).toLowerCase();
  const s=(v.specifics||[]).find(x=>clean(x.name).toLowerCase()===low);
  return clean(s&&s.value)
}
function salePrice(v,discount){
  const n=Number(v&&v.sourcePrice);if(!isFinite(n)||n<=0)return'';
  return (Math.round(n*(1-discount)*100)/100).toFixed(2)
}
function identifier(v,names){
  for(const n of names){
    if(v&&v[n]!=null&&clean(v[n]))return clean(v[n]);
    const s=(v&&v.specifics||[]).find(x=>clean(x.name).toLowerCase()===String(n).toLowerCase());
    if(s&&clean(s.value))return clean(s.value)
  }
  return''
}
function safeUrl(u){u=clean(u).replace(/\s/g,'%20');return /^https?:\/\//i.test(u)?u:''}
function defaultPhotos(data,clone){
  const out=[];
  for(const u of [...(clone.images||[]),...(data.images||[])]){
    const x=safeUrl(u);if(x&&!out.includes(x))out.push(x)
  }
  return out.slice(0,12)
}
function technicalSpecsFromDescription(){
  const out={};
  const clone=cloneData()||{};
  const html=String(clone.descriptionHtml||'').trim();
  if(!html)return out;
  try{
    const doc=new DOMParser().parseFromString(html,'text/html');
    const heading=[...doc.querySelectorAll('h1,h2,h3,h4')]
      .find(h=>/^technical specifications$/i.test(clean(h.textContent||'')));
    if(!heading)return out;
    const section=heading.nextElementSibling||heading.parentElement||doc.body;
    for(const strong of section.querySelectorAll('b,strong')){
      const name=clean(strong.textContent||'').replace(/:$/,'');
      if(!name||name.length>90)continue;
      const row=strong.parentElement;
      const full=clean(row&&row.textContent||'');
      const label=clean(strong.textContent||'');
      const pos=full.indexOf(label);
      const value=clean(pos>=0?full.slice(pos+label.length):'').replace(/^:\s*/,'');
      if(value&&!out[name])out[name]=value
    }
  }catch(_){}
  return out
}
function currentItemSpecifics(){
  const clone=cloneData()||{},out={};
  const reserved=/^(title|description|category|item category|price|pricing|quantity|condition|shipping|shipping policy|payment|payment policy|returns?|return policy|location|item location|custom label|custom label \(sku\)|schedule time|format|duration|photos?|variations?|essential|optional|required)$/i;
  const canonicalName=name=>{
    const n=clean(name).replace(/[?*:]+$/,'').trim();
    const aliases={
      'brand':'Brand',
      'compatible brand':'Compatible Brand',
      'type':'Type',
      'material':'Material',
      'compatible model':'Compatible Model',
      'personalize':'Personalize',
      'personalized':'Personalized',
      'country of origin':'Country of Origin',
      'band type':'Band Type',
      'band width':'Band Width',
      'colour':'Color'
    };
    return aliases[n.toLowerCase()]||n
  };
  const badValue=(name,value)=>{
    const n=clean(name).toLowerCase(),v=clean(value);
    if(!v)return true;
    if(v.toLowerCase()===n)return true;
    if(/search(?: or enter your own)?\.?\s*(?:search results|results) appear below/i.test(v))return true;
    if(/^(enter your own|select|choose|add|suggested:.*)$/i.test(v))return true;
    const labelHits=(v.match(/(?:^|\s)(?:Brand|Compatible Brand|Personalize|Personalized|Type|Band Type|Band Width|Compatible Model|Material|Country of Origin)\s*:/gi)||[]).length;
    if(labelHits>=2)return true;
    return false
  };
  const put=(name,value,overwrite=false)=>{
    name=canonicalName(name);value=clean(value);
    if(!name||!value||reserved.test(name)||name.length>90||value.length>1000)return;
    if(badValue(name,value))return;
    if(overwrite||!out[name])out[name]=value
  };

  // Golden source order: same Technical Specifications already used in the aligned CSV.
  for(const [k,v] of Object.entries(technicalSpecsFromDescription()))put(k,v,false);

  // Backend aspects fill only fields not already present.
  for(const [k,v] of Object.entries(clone.aspects||{}))put(k,v,false);

  // eBay page values override when already populated in Essential/Optional.
  const markers=[...document.querySelectorAll('h1,h2,h3,h4,h5,legend,div,span')]
    .filter(x=>visible(x)&&/^(essential|optional|required)$/i.test(clean(x.innerText||x.textContent||'')));
  let root=null;
  for(const marker of markers){
    let p=marker.parentElement;
    for(let depth=0;depth<8&&p;depth++,p=p.parentElement){
      const controls=p.querySelectorAll('input,textarea,select,[role="combobox"],[role="radio"],button');
      if(controls.length>=3&&controls.length<=180){
        if(!root||p.querySelectorAll('*').length>root.querySelectorAll('*').length)root=p
      }
    }
  }

  if(root){
    const labels=[...root.querySelectorAll('label,div,span,p')]
      .filter(visible)
      .filter(el=>el.children.length===0)
      .map(el=>({el,name:canonicalName(el.innerText||el.textContent||'')}))
      .filter(x=>x.name&&x.name.length<=80)
      .filter(x=>!/^(essential|optional|required|yes|no|suggested:.*|\d+\/\d+|enter your own)$/i.test(x.name))
      .filter(x=>!reserved.test(x.name));

    const valueFromRow=row=>{
      const checked=row.querySelector('input[type="radio"]:checked,input[type="checkbox"]:checked,[role="radio"][aria-checked="true"],button[aria-pressed="true"],[data-state="checked"]');
      if(checked){
        const v=clean(checked.value||checked.innerText||checked.textContent||checked.getAttribute('aria-label')||'');
        if(v)return v
      }
      const select=row.querySelector('select');
      if(select){const v=clean(controlValue(select));if(v)return v}
      const combo=row.querySelector('[role="combobox"]');
      if(combo){const v=clean(controlValue(combo));if(v)return v}
      const input=row.querySelector('input[type="text"],input[type="search"],input:not([type]),textarea');
      if(input&&clean(input.value))return clean(input.value);
      const buttons=[...row.querySelectorAll('button,[role="button"]')].filter(visible);
      for(const b of buttons){
        const v=clean(b.innerText||b.textContent||b.value||b.getAttribute('aria-label')||'');
        if(v&&!badValue('',v))return v
      }
      return''
    };

    for(const item of labels){
      let row=item.el.parentElement;
      for(let depth=0;depth<5&&row;depth++,row=row.parentElement){
        const v=valueFromRow(row);
        if(v&&!badValue(item.name,v)){put(item.name,v,true);break}
      }
    }
  }
  return out
}
function dynamicAspectHeaders(dims,baseHeaders){
  const clone=cloneData()||{};
  const source={};
  const put=(name,value)=>{
    name=clean(name).replace(/[?*:]+$/,'').trim();
    value=clean(value);
    if(!name||!value||name.length>90||value.length>1000)return;
    if(/^(review item specifics|suggested item|show more|apply all|dismiss tooltip|department|handmade|unit type|vintage|year manufactured)$/i.test(name))return;
    if(/search(?: or enter your own)?|results appear below/i.test(name))return;
    if(/^(apply all|dismiss tooltip|no|yes)$/i.test(value))return;
    if(!source[name])source[name]=value
  };

  for(const [k,v] of Object.entries(technicalSpecsFromDescription()))put(k,v);
  for(const [k,v] of Object.entries(clone.aspects||{}))put(k,v);

  const blocked=new Set((dims||[]).map(d=>clean(d.name).toLowerCase().replace(/colour/g,'color')));
  const existing=new Set((baseHeaders||[]).map(h=>clean(h).toLowerCase()));
  const out=[];

  for(const [k,v] of Object.entries(source)){
    const name=clean(k),val=clean(v),nk=name.toLowerCase().replace(/colour/g,'color');
    if(!name||!val||blocked.has(nk))continue;
    if(/^(upc|ean|isbn|epid)$/i.test(name))continue;
    const header='C:'+name;
    if(!existing.has(header.toLowerCase())){
      out.push(header);
      existing.add(header.toLowerCase())
    }
  }
  return out
}
function countryName(v){
  const raw=clean(v),code=raw.toUpperCase();
  if(/^[A-Z]{2}$/.test(code)){
    try{
      const dn=new Intl.DisplayNames(['en'],{type:'region'});
      const name=clean(dn.of(code));
      if(name&&name!==code)return name
    }catch(_){}
  }
  return ({PK:'Pakistan',US:'United States',GB:'United Kingdom',AU:'Australia',CA:'Canada'})[code]||raw
}
function locationValue(clone){
  const p=clone.itemLocationParts||{};
  const city=clean(p.city),state=clean(p.stateOrProvince),country=countryName(p.country);
  if(city&&state)return city+', '+state;
  if(city&&country)return city+', '+country;
  const raw=clean(clone.itemLocation||'');
  const parts=raw.split(',').map(clean).filter(Boolean);
  if(parts.length>=2){
    const last=parts[parts.length-1];
    return parts[0]+', '+countryName(last)
  }
  return raw.replace(/,?\s*\d[\d*\- ]{2,}\s*(?:,\s*[A-Z]{2})?$/i,'').trim()
}
function sourceValueMap(clone){
  const out={};
  const put=(k,v)=>{const key=clean(k);const val=clean(v);if(key&&val&&!out[key.toLowerCase()])out[key.toLowerCase()]=val};
  for(const [k,v] of Object.entries(clone||{})){if(v==null||typeof v==='object')continue;put(k,v)}
  for(const [k,v] of Object.entries(clone.aspects||{}))put(k,v);
  return out
}
function findAspectHeader(headers,name){
  const raw=clean(name);
  const exact='C:'+raw;
  let i=headers.findIndex(h=>clean(h).toLowerCase()===exact.toLowerCase());
  if(i>=0)return headers[i];
  const nk=raw.toLowerCase().replace(/colour/g,'color').replace(/[^a-z0-9]/g,'');
  i=headers.findIndex(h=>{
    if(!/^C:/i.test(h))return false;
    const hk=clean(h.slice(2)).toLowerCase().replace(/colour/g,'color').replace(/[^a-z0-9]/g,'');
    return hk===nk
  });
  return i>=0?headers[i]:''
}
function fillAspects(row,idx,headers,clone,dims){
  const aspects=currentItemSpecifics();
  const blocked=new Set((dims||[]).map(d=>clean(d.name).toLowerCase().replace(/colour/g,'color')));
  for(const [name,val] of Object.entries(aspects)){
    const key=clean(name).toLowerCase().replace(/colour/g,'color');
    if(blocked.has(key))continue;
    const h=findAspectHeader(headers,name);
    if(h&&idx[h]!=null&&!row[idx[h]])row[idx[h]]=clean(val)
  }
}
function fillDirectTemplateFields(row,idx,headers,clone){
  const src=sourceValueMap(clone);
  const aliases={
    'P:EPID':['epid','ePID'],
    'VideoID':['videoid','video id'],
    'Manufacturer Name':['manufacturer name','manufacturer'],
    'Manufacturer AddressLine1':['manufacturer addressline1','manufacturer address 1'],
    'Manufacturer AddressLine2':['manufacturer addressline2','manufacturer address 2'],
    'Manufacturer City':['manufacturer city'],
    'Manufacturer Country':['manufacturer country'],
    'Manufacturer PostalCode':['manufacturer postalcode','manufacturer postal code'],
    'Manufacturer StateOrProvince':['manufacturer stateorprovince','manufacturer state','manufacturer province'],
    'Manufacturer Phone':['manufacturer phone'],
    'Manufacturer Email':['manufacturer email'],
    'Manufacturer ContactURL':['manufacturer contacturl','manufacturer url'],
    'Responsible Person 1':['responsible person 1'],
    'Responsible Person 1 Type':['responsible person 1 type'],
    'Responsible Person 1 AddressLine1':['responsible person 1 addressline1'],
    'Responsible Person 1 AddressLine2':['responsible person 1 addressline2'],
    'Responsible Person 1 City':['responsible person 1 city'],
    'Responsible Person 1 Country':['responsible person 1 country'],
    'Responsible Person 1 PostalCode':['responsible person 1 postalcode'],
    'Responsible Person 1 StateOrProvince':['responsible person 1 stateorprovince'],
    'Responsible Person 1 Phone':['responsible person 1 phone'],
    'Responsible Person 1 Email':['responsible person 1 email'],
    'Responsible Person 1 ContactURL':['responsible person 1 contacturl'],
    'TakeBackPolicyID':['takebackpolicyid','take back policy id'],
    'Regional TakeBackPolicies':['regional takebackpolicies','regional take back policies'],
    'ProductCompliancePolicyID':['productcompliancepolicyid','product compliance policy id'],
    'Regional ProductCompliancePolicies':['regional productcompliancepolicies','regional product compliance policies'],
    'Hazmat Pictograms':['hazmat pictograms'],'Hazmat SignalWord':['hazmat signalword','hazmat signal word'],
    'Hazmat Statements':['hazmat statements'],'Hazmat Component':['hazmat component'],
    'EcoParticipationFee':['ecoparticipationfee','eco participation fee'],
    'Product Safety Pictograms':['product safety pictograms'],'Product Safety Statements':['product safety statements'],
    'Product Safety Component':['product safety component'],'Regulatory Document Ids':['regulatory document ids']
  };
  for(const [header,names] of Object.entries(aliases)){
    if(idx[header]==null)continue;
    for(const n of names){const v=src[String(n).toLowerCase()];if(v){row[idx[header]]=v;break}}
  }
}

function buildCsv(){
  const st=variantState(),clone=cloneData();
  if(!st||!st.data||!st.data.hasVariations)throw Error('Dati varianti non disponibili');
  if(!clone||!clone.ok)throw Error('Dati listing non ancora pronti');

  const data=st.data,dims=Array.isArray(data.dimensions)?data.dimensions:[],variants=Array.isArray(data.variants)?data.variants:[];
  if(!dims.length||!variants.length)throw Error('Varianti incomplete nel payload');

  const baseHeaders=listingsExportHeaders();
  const dynamicHeaders=dynamicAspectHeaders(dims,baseHeaders);
  const extraHeaders=['PicURL'].filter(h=>!baseHeaders.includes(h));
  const headers=[...baseHeaders,...dynamicHeaders,...extraHeaders];
  const idx=Object.fromEntries(headers.map((h,i)=>[h,i]));
  const actionHeader=headers.find(h=>/^\*Action\(/i.test(h));
  const row=()=>Array(headers.length).fill('');

  const title=currentTitle(),categoryId=currentCategoryId(),categoryName=currentCategoryName();
  const description=String(currentDescription()||'').slice(0,32700);
  const shipping=normalizePolicyName(policyName('shipping'));
  const returns=normalizePolicyName(policyName('return'));
  const payment=normalizePolicyName(policyName('payment'));
  const conditionId=currentConditionId();
  const location=locationValue(clone);
  const qty=Number(clone.quantity||3)||3;
  const discount=isFinite(Number(st.discountRate))?Number(st.discountRate):.02;
  const skuBase=currentSkuBase();
  const commonImages=defaultPhotos(data,clone).join('|');

  const missing=[];
  if(!title)missing.push('Title');
  if(!categoryId)missing.push('Category ID');
  if(!description)missing.push('Description');
  if(!conditionId)missing.push('Condition ID');
  if(!location)missing.push('Location');
  if(missing.length)throw Error('Dati obbligatori CSV mancanti: '+missing.join(', '));
  const missingPolicies=[];
  if(!shipping)missingPolicies.push('Shipping profile name');
  if(!returns)missingPolicies.push('Return profile name');
  if(!payment)missingPolicies.push('Payment profile name');

  const parent=row();
  parent[idx[actionHeader]]='Add';
  parent[idx['Custom label (SKU)']]=skuBase;
  parent[idx['Category ID']]=categoryId;
  if(idx['Category name']!=null)parent[idx['Category name']]=categoryName;
  parent[idx['Title']]=title;
  parent[idx['Item photo URL']]=commonImages;
  parent[idx['Description']]=description;
  parent[idx['Relationship details']]=relationshipParent(dims);
  parent[idx['Shipping profile name']]=shipping;
  parent[idx['Return profile name']]=returns;
  parent[idx['Payment profile name']]=payment;
  parent[idx['Condition ID']]=conditionId;
  parent[idx['Format']]='FixedPrice';
  parent[idx['Duration']]='GTC';
  parent[idx['Location']]=location;
  if(idx['PicURL']!=null)parent[idx['PicURL']]=commonImages;
  fillAspects(parent,idx,headers,clone,dims);
  fillDirectTemplateFields(parent,idx,headers,clone);

  const rows=[parent];
  const photoDim=dims[0]&&clean(dims[0].name);
  const photoDone=new Set();

  variants.forEach((v,i)=>{
    const r=row();
    r[idx[actionHeader]]='Add';
    r[idx['Custom label (SKU)']]=(skuBase+'-'+String(i+1).padStart(2,'0')).slice(0,50);
    r[idx['Relationship']]='Variation';
    r[idx['Relationship details']]=relationshipChild(v);
    r[idx['Quantity']]=qty;
    r[idx['Start price']]=salePrice(v,discount);
    r[idx['Location']]=location;
    const upc=identifier(v,['upc','UPC']);
    if(upc)r[idx['P:UPC']]=upc;
    const mpn=identifier(v,['mpn','MPN']);
    if(mpn&&idx['C:MPN']!=null)r[idx['C:MPN']]=mpn;

    if(photoDim){
      const pv=firstSpecificValue(v,photoDim),key=pv.toLowerCase();
      if(pv&&!photoDone.has(key)){
        const urls=(v.images||[]).map(safeUrl).filter(Boolean).slice(0,12);
        if(urls.length&&idx['PicURL']!=null){r[idx['PicURL']]=pv+'='+urls.join('|');photoDone.add(key)}
      }
    }
    rows.push(r)
  });

  const info1=row(),info2=row(),info3=row();
  info1[0]='#INFO';
  if(info1.length>1)info1[1]='Created='+Date.now();
  info2[0]='#INFO';
  if(info2.length>1)info2[1]='Version=1.0';
  if(info2.length>3)info2[3]='Template=fx_category_template_EBAY_US';
  info3[0]='#INFO';
  if(idx['Schedule Time']!=null)info3[idx['Schedule Time']]='YYYY-MM-DD HH:MM:SS';

  const output=[info1,info2,info3,headers,...rows];
  const csv=output.map(r=>r.map(escCsv).join(',')).join('\r\n');
  return {
    csv,
    fileName:'sell-like-variants-'+clean(data.itemId||window.__capitanSellLikeSourceItemId||Date.now())+'.csv',
    rows:variants.length,
    columns:headers.length,
    policies:{shipping,payment,returns},
    missingPolicies,
    required:{title,categoryId,description,conditionId,location}
  }
}
function download(res){
  const blob=new Blob(['\ufeff'+res.csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=res.fileName;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},500)
}
async function run(){
  for(let i=0;i<120;i++){
    const st=variantState(),cl=cloneData();
    if(st&&st.data&&st.data.hasVariations&&cl&&cl.ok){
      try{
        const categoryId=currentCategoryId();
        if(categoryId){
          try{
            const tax=await taxonomyCategoryLookup(categoryId);
            if(tax&&tax.ok&&clean(tax.categoryName)){
              window.__capitanTaxonomyCategoryName=clean(tax.categoryName)
            }else if(tax&&tax.error){
              console.warn('eBay Taxonomy category lookup',tax.error)
            }
          }catch(taxErr){
            console.warn('eBay Taxonomy category lookup',taxErr)
          }
        }
        const res=buildCsv();
        window.__capitanVariantCsv=res;
        const panel=document.getElementById('capitan-sell-like-clone');
        const b=panel&&panel.querySelector('[data-ebay-action="csv"],[data-ebay-action="save"]');
        window.__capitanDownloadVariantCsv=()=>download(res);
        if(b){
          b.dataset.ebayAction='csv';
          b.textContent='Scarica CSV';
          b.style.background='#16a34a';
          b.style.color='#fff';
          b.style.border='1px solid #12813a';
          b.style.fontWeight='700';
          b.style.cursor='pointer';
          b.onclick=null
        }
        const list=panel&&panel.querySelector('[data-ebay-action="list"]');
        if(list)list.style.display='none';
        const mainStatus=document.querySelector('#capitan-sell-like-clone #st');
        if(mainStatus)mainStatus.innerHTML='<span class="ok">Preparazione completata.</span> CSV eBay pronto.';
        const staleStatus=document.querySelector('#capitan-variants-auto-status');
        if(staleStatus){staleStatus.style.color='#137333';staleStatus.textContent='CSV eBay pronto.'}
        setStatus('CSV eBay pronto: '+res.rows+' varianti, '+res.columns+' colonne mappate.');
        try{if(typeof window.__capitanStopProcessTimer==='function')window.__capitanStopProcessTimer()}catch(_){};
      }catch(e){
        console.warn('Variant CSV',e);
        const msg=(e&&e.message?e.message:e);
        setStatus('CSV varianti non generato: '+msg,true);
        const mainStatus=document.querySelector('#capitan-sell-like-clone #st');
        if(mainStatus)mainStatus.innerHTML='<span class="bad">Preparazione non completata.</span> '+String(msg);
        try{if(typeof window.__capitanStopProcessTimer==='function')window.__capitanStopProcessTimer()}catch(_){};
      }
      return
    }
    await sleep(250)
  }
  setStatus('CSV varianti non generato: dati non pronti.',true);
  try{if(typeof window.__capitanStopProcessTimer==='function')window.__capitanStopProcessTimer()}catch(_){};
}
run();
})();
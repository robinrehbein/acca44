import 'dotenv/config';
import assert from 'node:assert/strict';
const base=process.env.TEST_SERVER_URL||'http://localhost:3001';
const url=new URL(base);
assert.equal(process.env.TEST_ALLOW_MUTATIONS,'true','Set TEST_ALLOW_MUTATIONS=true for destructive demo stock/order fixtures');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname)||process.env.TEST_ALLOW_REMOTE_MUTATIONS==='true','Remote mutation requires TEST_ALLOW_REMOTE_MUTATIONS=true');
class Client {
  token;
  constructor(api='shop-api'){this.api=api;}
  async raw(query,variables={}){
    const response=await fetch(`${base}/${this.api}`,{method:'POST',headers:{'content-type':'application/json','Apollo-Require-Preflight':'true',...(this.token?{authorization:`Bearer ${this.token}`}:{})},body:JSON.stringify({query,variables})});
    this.token=response.headers.get('vendure-auth-token')||this.token;
    return response.json();
  }
  async query(query,variables={}){const result=await this.raw(query,variables);if(result.errors)throw Error(JSON.stringify(result.errors));return result.data;}
}
const orderFields='id code state totalWithTax lines{id quantity}';
const results=[];
function pass(name){results.push(name);console.log(`PASS ${name}`);}
const admin=new Client('admin-api');
const login='mutation($username:String!,$password:String!){login(username:$username,password:$password){__typename ...on CurrentUser{id}}}';
assert.equal((await admin.query(login,{username:process.env.SUPERADMIN_USERNAME,password:process.env.SUPERADMIN_PASSWORD})).login.__typename,'CurrentUser');
assert.notEqual((await new Client('admin-api').query(login,{username:process.env.SUPERADMIN_USERNAME,password:'intentionally-invalid-demo-password'})).login.__typename,'CurrentUser');
assert.ok((await new Client('admin-api').raw('{ products {totalItems} }')).errors);
const operator=new Client('admin-api');
assert.equal((await operator.query(login,{username:'operator@acca44.example',password:process.env.DEMO_OPERATOR_PASSWORD})).login.__typename,'CurrentUser');
assert.ok((await operator.query('{products{totalItems} orders{totalItems} stockLocations{totalItems}}')).products.totalItems>=12);
assert.ok((await operator.raw('{ administrators {totalItems} }')).errors);
assert.ok((await operator.raw('mutation { updateGlobalSettings(input:{availableLanguages:[de]}) { __typename } }')).errors);
pass('Authentication, anonymous denial, operator inventory/order access and system denial');
const schema=await admin.query('{a:__type(name:"CancelOrderInput"){inputFields{name}} b:__type(name:"FulfillOrderInput"){inputFields{name}} c:__type(name:"CancelOrderResult"){possibleTypes{name}} d:__type(name:"AddFulfillmentToOrderResult"){possibleTypes{name}}}');
assert.ok(schema.a.inputFields.some(f=>f.name==='orderId'));assert.ok(schema.b.inputFields.some(f=>f.name==='lines'));
pass('Live cancellation/fulfillment schema introspection');
// Recover only abandoned orders created by this smoke test, never unrelated demo work.
const abandoned=(await admin.query('{orders(options:{take:100}){items{id state active customer{emailAddress} lines{id quantity}}}}')).orders.items;
for(const order of abandoned.filter(o=>o.customer?.emailAddress?.startsWith('smoke-')&&o.customer.emailAddress.endsWith('@acca44.example')&&o.state!=='Cancelled'&&!o.active)) await cancel(order);
const product=(await admin.query('query($slug:String!){product(slug:$slug){id variants{id sku stockLevels{stockOnHand stockAllocated stockLocation{id name}}}}}',{slug:'satorisan-morgenlicht'})).product;
assert.ok(product?.variants.length>=3);
const variant=product.variants.find(v=>v.stockLevels.every(l=>l.stockAllocated===0));
assert.ok(variant,'Need one unallocated Morgenlicht variant for isolated smoke fixture');
const locations=Object.fromEntries(variant.stockLevels.map(l=>[l.stockLocation.name,l.stockLocation.id]));
assert.ok(locations.Lindau&&locations.Friedrichshafen);
const stockQuery='query($id:ID!){productVariant(id:$id){id stockLevels{stockOnHand stockAllocated stockLocation{id name}} stockMovements(options:{take:100}){items{...on StockMovement{id type quantity}}}}}';
async function snapshot(){return (await admin.query(stockQuery,{id:variant.id})).productVariant;}
async function expectStock(lh,la,fh,fa){const s=await snapshot();const map=Object.fromEntries(s.stockLevels.map(l=>[l.stockLocation.name,l]));assert.deepEqual([map.Lindau.stockOnHand,map.Lindau.stockAllocated,map.Friedrichshafen.stockOnHand,map.Friedrichshafen.stockAllocated],[lh,la,fh,fa]);return s;}
let baselineMovementIds=new Set();
async function setStock(lindau,fh){baselineMovementIds=new Set((await snapshot()).stockMovements.items.map(m=>m.id));assert.ok((await snapshot()).stockLevels.every(l=>l.stockAllocated===0),'Fixture must have no active allocations');await admin.query('mutation($input:[UpdateProductVariantInput!]!){updateProductVariants(input:$input){id}}',{input:[{id:variant.id,stockLevels:[{stockLocationId:locations.Lindau,stockOnHand:lindau},{stockLocationId:locations.Friedrichshafen,stockOnHand:fh}]}]});}

async function prepare(quantity,tag){const shop=new Client();let r=await shop.query(`mutation($id:ID!,$q:Int!){addItemToOrder(productVariantId:$id,quantity:$q){__typename ...on Order{${orderFields}} ...on ErrorResult{message}}}`,{id:variant.id,q:quantity});assert.equal(r.addItemToOrder.__typename,'Order',JSON.stringify(r));
await shop.query('mutation($input:CreateCustomerInput!){setCustomerForOrder(input:$input){__typename}}',{input:{emailAddress:`smoke-${Date.now()}-${tag}@acca44.example`,firstName:'Synthetic',lastName:'Smoke'}});
await shop.query('mutation($input:CreateAddressInput!){setOrderShippingAddress(input:$input){__typename}}',{input:{fullName:'Synthetic Smoke',streetLine1:'Demo Straße 1',city:'Lindau',postalCode:'88131',countryCode:'DE'}});
const methods=(await shop.query('{eligibleShippingMethods{id code}}')).eligibleShippingMethods;assert.ok(methods.length);
await shop.query('mutation($id:[ID!]!){setOrderShippingMethod(shippingMethodId:$id){__typename}}',{id:[methods[0].id]});
r=await shop.query(`mutation{transitionOrderToState(state:"ArrangingPayment"){__typename ...on Order{${orderFields}} ...on ErrorResult{message}}}`);assert.equal(r.transitionOrderToState.__typename,'Order',JSON.stringify(r));return {shop,order:r.transitionOrderToState};}
async function pay(prepared){return (await prepared.shop.query(`mutation{addPaymentToOrder(input:{method:"demo-payment",metadata:{}}){__typename ...on Order{${orderFields}} ...on ErrorResult{message}}}`)).addPaymentToOrder;}
async function buy(q,tag){const p=await prepare(q,tag);const order=await pay(p);assert.equal(order.__typename,'Order',JSON.stringify(order));assert.equal(order.state,'PaymentSettled');return order;}
async function cancel(order){const result=(await admin.query(`mutation($input:CancelOrderInput!){cancelOrder(input:$input){__typename ...on Order{${orderFields}} ...on ErrorResult{message}}}`,{input:{orderId:order.id,reason:'Synthetic local smoke cleanup',cancelShipping:true}})).cancelOrder;assert.equal(result.__typename,'Order',JSON.stringify(result));return result;}
async function fulfill(order,quantity){const result=(await admin.query('mutation($input:FulfillOrderInput!){addFulfillmentToOrder(input:$input){__typename ...on Fulfillment{id state} ...on ErrorResult{message}}}',{input:{lines:[{orderLineId:order.lines[0].id,quantity}],handler:{code:'manual-fulfillment',arguments:[{name:'method',value:'Synthetic demo shipment'},{name:'trackingCode',value:'DEMO-NOT-A-PARCEL'}]}}})).addFulfillmentToOrder;assert.equal(result.__typename,'Fulfillment',JSON.stringify(result));return result;}
function movements(snapshot,order,type){return snapshot.stockMovements.items.filter(m=>m.type===type&&!baselineMovementIds.has(m.id)&&(!m.orderLine||m.orderLine.id===order.lines[0].id)).map(m=>m.quantity).sort((a,b)=>a-b);}
await setStock(2,2);
const split=await buy(3,'split');
let state=await expectStock(2,2,2,1);assert.deepEqual(movements(state,split,'ALLOCATION'),[1,2]);
await fulfill(split,2);state=await expectStock(0,0,2,1);assert.deepEqual(movements(state,split,'SALE'),[-2]);
await fulfill(split,1);state=await expectStock(0,0,1,0);assert.deepEqual(movements(state,split,'SALE'),[-2,-1]);
pass('Buy3 reserves Lindau2/Friedrichshafen1; partial fulfillment2+1 has exact stock and ledger quantities');
await setStock(2,2);
const cancelled=await buy(3,'cancel');await expectStock(2,2,2,1);await cancel(cancelled);state=await expectStock(2,0,2,0);assert.deepEqual(movements(state,cancelled,'RELEASE'),[1,2]);
pass('Cancellation before fulfillment releases exact original locations and ledger quantities');
await setStock(2,2);const partial=await buy(3,'partial-cancel');await fulfill(partial,2);await cancel(partial);state=await expectStock(2,0,2,0);assert.deepEqual(movements(state,partial,'CANCELLATION'),[2]);assert.deepEqual(movements(state,partial,'RELEASE'),[1]);
pass('Cancellation after partial fulfillment returns sold Lindau2 and releases Friedrichshafen1');
await setStock(1,0);const a=await prepare(1,'race-a');const b=await prepare(1,'race-b');
const competing=await Promise.allSettled([pay(a),pay(b)]);
const accepted=competing.filter(r=>r.status==='fulfilled'&&r.value.__typename==='Order'&&r.value.state==='PaymentSettled');
assert.equal(accepted.length,1,JSON.stringify(competing.map(r=>r.status==='fulfilled'?r.value:{status:r.status,message:r.reason.message})));
await expectStock(1,1,0,0);
await cancel(accepted[0].value);await expectStock(1,0,0,0);
pass('Concurrent last-pair payments: exactly one accepted, no paid underallocation, winner cancellation restores stock');
await setStock(2,2);
console.log(`${results.length} integration checks passed; test variant ${variant.sku}; synthetic orders remain as demo evidence.`);

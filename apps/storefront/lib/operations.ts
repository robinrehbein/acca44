const order = `id code state totalQuantity subTotalWithTax shippingWithTax totalWithTax currencyCode lines { id quantity linePriceWithTax productVariant { id name product { slug } } }`;
const result = `... on Order { ${order} } ... on ErrorResult { errorCode message }`;
export const operations = {
  catalog: `query Catalog { search(input:{take:100,groupByProduct:true}) { items { productId productName slug priceWithTax { ... on SinglePrice { value } ... on PriceRange { min max } } facetValueIds } facetValues { count facetValue { id name facet { name code } } } } }`,
  product: `query Product($slug:String!) { product(slug:$slug) { id name slug description facetValues { id name facet { code name } } variants { id name priceWithTax currencyCode stockLevel options { code name group { code name } } } } }`,
  order: `query Order { activeOrder { ${order} } }`,
  add: `mutation Add($variantId:ID!,$quantity:Int!) { addItemToOrder(productVariantId:$variantId,quantity:$quantity) { ${result} } }`,
  adjust: `mutation Adjust($lineId:ID!,$quantity:Int!) { adjustOrderLine(orderLineId:$lineId,quantity:$quantity) { ${result} } }`,
  remove: `mutation Remove($lineId:ID!) { removeOrderLine(orderLineId:$lineId) { ${result} } }`,
  customer: `mutation Customer($input:CreateCustomerInput!) { setCustomerForOrder(input:$input) { ${result} } }`,
  shippingAddress: `mutation ShippingAddress($input:CreateAddressInput!) { setOrderShippingAddress(input:$input) { ${result} } }`,
  billingAddress: `mutation BillingAddress($input:CreateAddressInput!) { setOrderBillingAddress(input:$input) { ${result} } }`,
  shipping: `query Shipping { eligibleShippingMethods { id name priceWithTax } }`,
  setShipping: `mutation SetShipping($ids:[ID!]!) { setOrderShippingMethod(shippingMethodId:$ids) { ${result} } }`,
  transition: `mutation Transition { transitionOrderToState(state:"ArrangingPayment") { ... on Order { ${order} } ... on OrderStateTransitionError { errorCode message } } }`,
  payments: `query Payments { eligiblePaymentMethods { id code name isEligible eligibilityMessage } }`,
  pay: `mutation Pay { addPaymentToOrder(input:{method:"demo-payment",metadata:{demo:true}}) { ${result} } }`,
} as const;
export type Operation = keyof typeof operations;

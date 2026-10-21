import assert from 'node:assert/strict';

// A real, mutating checkout through the deployed storefront BFF; no admin credentials.
const base = new URL(process.env.TEST_STOREFRONT_URL || 'https://acca44.robinrehbein.de');
assert.equal(process.env.TEST_ALLOW_MUTATIONS, 'true', 'Set TEST_ALLOW_MUTATIONS=true to create a synthetic paid demo order');
const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
assert.ok(local || process.env.TEST_ALLOW_REMOTE_MUTATIONS === 'true', 'Remote checkout requires TEST_ALLOW_REMOTE_MUTATIONS=true');
assert.ok(base.protocol === 'https:' || (local && base.protocol === 'http:'), 'Remote storefront must use HTTPS');
assert.ok(!base.username && !base.password, 'Do not put credentials in the URL');

class Shop {
    cookies = new Map();
    async operation(operation, variables = {}) {
        const response = await fetch(new URL('/api/shop', base), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                origin: base.origin,
                'sec-fetch-site': 'same-origin',
                ...(this.cookies.size ? { cookie: [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ') } : {}),
            },
            body: JSON.stringify({ operation, variables }),
            signal: AbortSignal.timeout(25000),
            redirect: 'error',
        });
        for (const cookie of response.headers.getSetCookie()) {
            const pair = cookie.split(';', 1)[0];
            const separator = pair.indexOf('=');
            if (separator > 0) this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
        }
        const body = await response.json();
        assert.ok(response.ok, `${operation}: HTTP ${response.status}`);
        assert.ok(!body.errors?.length, `${operation}: ${body.errors?.[0]?.message || 'GraphQL error'}`);
        assert.ok(body.data && Object.keys(body.data).length === 1, `${operation}: invalid BFF response`);
        const result = Object.values(body.data)[0];
        assert.ok(!result?.errorCode, `${operation}: ${result?.message || 'Vendure operation rejected'}`);
        return result;
    }
}

const shop = new Shop();
const independent = new Shop();
assert.equal(await shop.operation('order'), null, 'Fresh checkout client must have an empty cart');
assert.equal(await independent.operation('order'), null, 'Independent client must have an empty cart');
const catalog = await shop.operation('catalog');
assert.ok(catalog.items?.length, 'Catalogue is empty: run the explicit demo seed first');
let selected;
for (const item of catalog.items) {
    const product = await shop.operation('product', { slug: item.slug });
    const variant = product?.variants.find(row => ['IN_STOCK', 'LOW_STOCK'].includes(row.stockLevel));
    if (variant) { selected = variant; break; }
}
assert.ok(selected, 'No in-stock variant available for synthetic checkout');
const cart = await shop.operation('add', { variantId: selected.id, quantity: 1 });
assert.equal(cart.totalQuantity, 1);
assert.ok(shop.cookies.has('acca44-session'), 'BFF must issue its session cookie');
assert.equal(await independent.operation('order'), null, 'Second client must not see the first cart');
await shop.operation('customer', { input: {
    emailAddress: 'deployed-smoke@acca44.example', firstName: 'Synthetic', lastName: 'Deployment Smoke',
} });
const address = {
    fullName: 'Synthetic Deployment Smoke', streetLine1: 'Demo Straße 1',
    city: 'Lindau', postalCode: '88131', countryCode: 'DE',
};
await shop.operation('shippingAddress', { input: address });
await shop.operation('billingAddress', { input: address });
const shipping = await shop.operation('shipping');
assert.ok(shipping.length, 'No eligible shipping method');
await shop.operation('setShipping', { ids: [shipping[0].id] });
const arranging = await shop.operation('transition');
assert.equal(arranging.state, 'ArrangingPayment');
const methods = await shop.operation('payments');
assert.ok(methods.some(method => method.code === 'demo-payment' && method.isEligible), 'Demo payment must be eligible');
const paid = await shop.operation('pay');
assert.equal(paid.state, 'PaymentSettled');
assert.equal(paid.totalQuantity, 1);
assert.ok(paid.code);
assert.equal(await independent.operation('order'), null, 'Independent session must remain empty after checkout');
assert.equal(await shop.operation('order'), null, 'Paid checkout must no longer be an active cart');
console.log(JSON.stringify({ orderCode: paid.code, state: paid.state }));

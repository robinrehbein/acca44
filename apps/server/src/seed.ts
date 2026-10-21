import 'reflect-metadata';
import {
    AdministratorService, bootstrap, ChannelService, CountryService, CurrencyCode, FacetService, FacetValueService,
    ID, LanguageCode, PaymentMethodService, Permission, ProductOptionGroupService, ProductOptionService,
    ProductService, ProductVariantService, RequestContextService, RoleService, ShippingMethodService, StockLocationService,
    TaxCategoryService, TaxRateService, UserService, ZoneService,
} from '@vendure/core';
import { GlobalFlag } from '@vendure/common/lib/generated-types';
import { config } from './vendure-config';
import { required, secret } from './environment';
import { code, demoCatalog } from './demo-catalog';

/** Additive seed: existing products, credentials and stock quantities are never overwritten. */
async function seed() {
    const app = await bootstrap({ ...config, apiOptions: { ...config.apiOptions, port: 0 } });
    try {
        const admins = app.get(AdministratorService);
        const anonymous = await app.get(RequestContextService).create({ apiType: 'admin' });
        const user = await app.get(UserService).getUserByEmailAddress(anonymous, required('SUPERADMIN_USERNAME'), 'administrator');
        if (!user) throw new Error('Superadmin missing');
        const ctx = await app.get(RequestContextService).create({ apiType: 'admin', user, languageCode: LanguageCode.de });
        const countryService = app.get(CountryService);
        let germany = (await countryService.findAll(ctx, { take: 100 })).items.find(c => c.code === 'DE');
        germany ??= await countryService.create(ctx, { code: 'DE', enabled: true, translations: [{ languageCode: LanguageCode.de, name: 'Deutschland' }] });
        const zones = app.get(ZoneService);
        const zone = (await zones.findAll(ctx)).items.find(z => z.name === 'Deutschland Demo')
            ?? await zones.create(ctx, { name: 'Deutschland Demo', memberIds: [germany.id] });
        const channels = app.get(ChannelService);
        await channels.update(ctx, { id: ctx.channelId, defaultLanguageCode: LanguageCode.de, availableLanguageCodes: [LanguageCode.de], defaultCurrencyCode: CurrencyCode.EUR, availableCurrencyCodes: [CurrencyCode.EUR], pricesIncludeTax: true, trackInventory: true, outOfStockThreshold: 0, defaultTaxZoneId: zone.id, defaultShippingZoneId: zone.id });
        // Recreate context after channel defaults change (prices are gross EUR cents).
        const localCtx = await app.get(RequestContextService).create({ apiType:'admin', user, languageCode: LanguageCode.de });
        const taxes = app.get(TaxCategoryService);
        const tax = (await taxes.findAll(localCtx)).items.find(t => t.name === 'Demo Standard 19%')
            ?? await taxes.create(localCtx, { name: 'Demo Standard 19%', isDefault: true });
        const rates = app.get(TaxRateService);
        if (!(await rates.findAll(localCtx)).items.some(r => r.name === 'Deutschland Demo 19%')) await rates.create(localCtx, { name: 'Deutschland Demo 19%', enabled: true, value: 19, categoryId: tax.id, zoneId: zone.id });
        const locations = app.get(StockLocationService);
        const existingLocations = (await locations.findAll(localCtx)).items;
        const defaultLocation = existingLocations.find(l => l.name === 'Default Stock Location');
        const lindau = existingLocations.find(l => l.name === 'Lindau') ?? (defaultLocation
            ? await locations.update(localCtx, { id: defaultLocation.id, name: 'Lindau', description: 'ACCA44 Lindau – Demo-Bestand' })
            : await locations.create(localCtx, { name: 'Lindau', description: 'ACCA44 Lindau – Demo-Bestand' }));
        const friedrichshafen = existingLocations.find(l => l.name === 'Friedrichshafen') ?? await locations.create(localCtx, { name: 'Friedrichshafen', description: 'ACCA44 Friedrichshafen – Demo-Bestand' });
        const facets = app.get(FacetService), values = app.get(FacetValueService);
        const facetCache = new Map<string, Awaited<ReturnType<FacetService['create']>>>();
        const valueCache = new Map<string, ID>();
        for (const [key, name] of [['brand','Marke'], ['category','Kategorie'], ['size','Größe / Länge'], ['color','Farbe']]) {
            const facet = (await facets.findAll(localCtx)).items.find(f => f.code === key) ?? await facets.create(localCtx, { code:key, isPrivate:false, translations:[{ languageCode:LanguageCode.de, name }] });
            facetCache.set(key, facet);
        }
        async function facetValue(key:string, name:string) {
            const cacheKey = `${key}:${code(name)}`;
            if (valueCache.has(cacheKey)) return valueCache.get(cacheKey)!;
            const facet = facetCache.get(key)!;
            const existing = (await values.findAll(localCtx, LanguageCode.de)).find(v => v.facetId === facet.id && v.code === code(name));
            const value = existing ?? await values.create(localCtx, facet, { code:code(name), translations:[{ languageCode:LanguageCode.de, name }] });
            valueCache.set(cacheKey, value.id); return value.id;
        }
        const products = app.get(ProductService), variants = app.get(ProductVariantService);
        const groups = app.get(ProductOptionGroupService), options = app.get(ProductOptionService);
        for (const [productIndex, item] of demoCatalog.entries()) {
            let product = await products.findOneBySlug(localCtx, item.slug, ['optionGroups']);
            product ??= await products.create(localCtx, { enabled:true, translations:[{ languageCode:LanguageCode.de, name:`${item.brand} ${item.name}`, slug:item.slug, description:'<p>Fiktives Modell für den ACCA44-Prototyp. Demo-Preis und Demo-Bestand, kein reales Markenangebot.</p>' }] });
            const optionMaps: Record<string, Map<string, ID>> = {};
            for (const [dimension, names] of [['color',item.colors], ['size',item.sizes]] as const) {
                const groupCode = `${item.slug}-${dimension}`;
                const group = (await groups.findAll(localCtx, {filter:{code:{eq:groupCode}}})).items[0] ?? await groups.create(localCtx, { code:`${item.slug}-${dimension}`, translations:[{ languageCode:LanguageCode.de, name:dimension === 'color' ? 'Farbe' : item.category === 'guertel' ? 'Länge (cm)' : 'Größe' }] });
                if (!product.optionGroups?.some(g => g.id === group.id)) await products.addOptionGroupToProduct(localCtx, product.id, group.id);
                optionMaps[dimension] = new Map();
                for (const name of names) { const option = (await options.findAll(localCtx, {filter:{code:{eq:code(name)}}}, group.id)).items[0] ?? await options.create(localCtx, group, { code:code(name), translations:[{ languageCode:LanguageCode.de, name }] }); optionMaps[dimension].set(name,option.id); }
            }
            for (const [colorIndex,color] of item.colors.entries()) for (const [sizeIndex,size] of item.sizes.entries()) {
                const sku = `${item.slug}-${color}-${size}`.toUpperCase();
                if ((await variants.findAll(localCtx, {filter:{sku:{eq:sku}}})).items.length) continue;
                const depleted = sizeIndex === 0 && colorIndex === 0;
                await variants.create(localCtx, [{ productId:product.id, sku, price:item.price, taxCategoryId:tax.id, trackInventory:GlobalFlag.TRUE,
                    optionIds:[optionMaps.color.get(color)!,optionMaps.size.get(size)!],
                    facetValueIds:await Promise.all([facetValue('brand',item.brand),facetValue('category',item.category),facetValue('color',color),facetValue('size',size)]),
                    translations:[{ languageCode:LanguageCode.de, name:`${item.brand} ${item.name} · ${color} · ${size}` }],
                    stockLevels:[{stockLocationId:lindau.id,stockOnHand:depleted ? 0 : 3 + (productIndex % 3)}, {stockLocationId:friedrichshafen.id,stockOnHand:depleted ? (productIndex % 2 === 0 ? 0 : 2) : 2}],
                }]);
            }
        }
        const shipping = app.get(ShippingMethodService);
        if (!(await shipping.findAll(localCtx)).items.some(s => s.code === 'demo-standard')) await shipping.create(localCtx, {
            code:'demo-standard', fulfillmentHandler:'manual-fulfillment', translations:[{languageCode:LanguageCode.de,name:'Demo-Versand Deutschland',description:'Simulation · 4,90 € inkl. MwSt.'}],
            checker:{code:'default-shipping-eligibility-checker',arguments:[{name:'orderMinimum',value:'0'}]},
            calculator:{code:'default-shipping-calculator',arguments:[{name:'rate',value:'490'},{name:'includesTax',value:'include'},{name:'taxRate',value:'19'}]},
        });
        const payments = app.get(PaymentMethodService);
        if (!(await payments.findAll(localCtx)).items.some(p => p.code === 'demo-payment')) await payments.create(localCtx, { code:'demo-payment', enabled:true, translations:[{languageCode:LanguageCode.de,name:'Demo-Zahlung',description:'Nur Simulation. Keine echte Belastung.'}], handler:{code:'demo-payment',arguments:[]} });
        const roles = app.get(RoleService);
        const role = (await roles.findAll(localCtx)).items.find(r => r.code === 'demo-operator') ?? await roles.create(localCtx, {
            code:'demo-operator', description:'Demo: Bestand, Bestellungen und Versand; keine Systemkonfiguration', channelIds:[localCtx.channelId],
            permissions:[Permission.Authenticated,Permission.ReadCatalog,Permission.CreateCatalog,Permission.UpdateCatalog,Permission.CreateAsset,Permission.ReadAsset,Permission.UpdateAsset,Permission.ReadStockLocation,Permission.UpdateStockLocation,Permission.ReadOrder,Permission.UpdateOrder,Permission.ReadCustomer,Permission.ReadShippingMethod,Permission.ReadPaymentMethod,Permission.ReadCountry,Permission.ReadZone,Permission.ReadTaxCategory,Permission.ReadTaxRate],
        });
        if (!(await admins.findAll(localCtx, {take:100})).items.some(a => a.emailAddress === 'operator@acca44.example')) await admins.create(localCtx, { emailAddress:'operator@acca44.example', firstName:'Demo',lastName:'Team', password:secret('DEMO_OPERATOR_PASSWORD'),roleIds:[role.id] });
        console.log('Demo seed complete: 12 products, additive; existing stock and orders preserved.');
    } finally { await app.close(); }
}
seed().catch(error => { console.error(error); process.exitCode = 1; });

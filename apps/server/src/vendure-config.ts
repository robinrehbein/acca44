import { DefaultJobQueuePlugin, DefaultSchedulerPlugin, DefaultSearchPlugin, LanguageCode, VendureConfig } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import path from 'node:path';
import { production, required, secret } from './environment';
import { demoPaymentHandler } from './demo-payment';
import { AccaStockPlugin } from './stock/acca-stock.plugin';
import { AccaStockLocationStrategy } from './stock/acca-stock-location-strategy';

export const config: VendureConfig = {
    defaultLanguageCode: LanguageCode.de,
    apiOptions: {
        csrfPrevention: true,
        port: Number(process.env.PORT ?? 3001), adminApiPath: 'admin-api', shopApiPath: 'shop-api',
        cors: { origin: [process.env.STOREFRONT_ORIGIN ?? 'http://localhost:3000'], credentials: true },
        adminApiPlayground: !production, shopApiPlayground: !production,
        ...(production ? { trustProxy: 1 } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: { identifier: required('SUPERADMIN_USERNAME'), password: secret('SUPERADMIN_PASSWORD') },
        cookieOptions: { secret: secret('COOKIE_SECRET'), secure: production, sameSite: 'lax' },
        requireVerification: false,
    },
    dbConnectionOptions: {
        type: 'postgres', host: process.env.DB_HOST ?? 'localhost', port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME ?? 'acca44', username: process.env.DB_USERNAME ?? 'acca44', password: production ? secret('DB_PASSWORD') : required('DB_PASSWORD'),
        synchronize: false, logging: false, migrations: [path.join(__dirname, 'migrations/*.+(js|ts)')],
    },
    catalogOptions: { stockLocationStrategy: new AccaStockLocationStrategy() },
    paymentOptions: { paymentMethodHandlers: [demoPaymentHandler] },
    plugins: [
        AccaStockPlugin,
        AssetServerPlugin.init({ route: 'assets', assetUploadDir: required('ASSET_UPLOAD_DIR'), assetUrlPrefix: process.env.ASSET_URL_PREFIX }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        DashboardPlugin.init({ route: 'dashboard', appDir: path.join(__dirname, '../dashboard') }),
    ],
};

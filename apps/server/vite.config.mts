import { LanguageCode } from '@vendure/common/lib/generated-types';
import { defineConfig } from 'vite';
import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
export default defineConfig({
    base: '/dashboard/',
    build: { outDir: 'dashboard' },
    plugins: [vendureDashboardPlugin({
        vendureConfigPath: './src/vendure-config.ts',
        gqlOutputPath: './src/gql',
        api: { host: 'auto', port: 'auto', adminApiPath: 'admin-api' },
        i18n: { defaultLanguage: LanguageCode.de, availableLanguages: [LanguageCode.de, LanguageCode.en], defaultLocale: 'de-DE' },
    })],
});

import 'dotenv/config';

export function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable ${name}`);
    return value;
}

export const production = process.env.NODE_ENV === 'production';
export function secret(name: string): string {
    const value = required(name);
    if (production && (value.length < 24 || /^(demo|change|password|superadmin)/i.test(value))) {
        throw new Error(`${name} must be a unique secret of at least 24 characters in production`);
    }
    return value;
}

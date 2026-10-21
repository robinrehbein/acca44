import 'reflect-metadata';
import { runMigrations } from '@vendure/core';
import { config } from './vendure-config';
runMigrations(config).then(() => process.exit(0)).catch(error => { console.error(error); process.exitCode = 1; });

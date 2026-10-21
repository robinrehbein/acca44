import 'reflect-metadata';
import path from 'node:path';
import { generateMigration } from '@vendure/core';
import { config } from './vendure-config';
const name = process.argv[2];
if (!name || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) throw new Error('Usage: migration:generate -- MigrationName');
generateMigration(config, { name, outputDir: path.join(__dirname, 'migrations') })
    .then(result => { console.log(result ?? 'No schema changes'); process.exit(0); })
    .catch(error => { console.error(error); process.exitCode = 1; });

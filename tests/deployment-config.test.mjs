import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('Coolify build phase can render Compose before runtime-only generated URLs exist', () => {
  const dir=mkdtempSync(join(tmpdir(),'acca44-compose-test-'));
  const file=join(dir,'.env');
  try {
    const keys=['POSTGRES','COOKIE','ADMIN','OPERATOR'];
    writeFileSync(file,keys.map(k=>`SERVICE_PASSWORD_64_${k}=${'a'.repeat(64)}`).join('\n'));
    const result=spawnSync('docker',['compose','--env-file',file,'-f','compose.yaml','config','--format','json'],{encoding:'utf8',env:{...process.env,SERVICE_URL_SERVER_3001:'',SERVICE_URL_STOREFRONT_3000:''}});
    assert.equal(result.status,0,result.stderr);
    const compose=JSON.parse(result.stdout);
    assert.equal(compose.services.server.environment.ASSET_URL_PREFIX,'https://api.acca44.robinrehbein.de/assets/');
    assert.equal(compose.services.storefront.environment.PUBLIC_STOREFRONT_URL,'https://acca44.robinrehbein.de');
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

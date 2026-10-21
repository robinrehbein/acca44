import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { allocate, remainingAtLocations } from '../src/stock/policy';

test('fills Lindau first and only the remaining quantity from Friedrichshafen', () => {
  assert.deepEqual(allocate([{ id: 'f', name: 'Friedrichshafen', available: 5 }, { id: 'l', name: 'Lindau', available: 2 }], 3), [{ id: 'l', quantity: 2 }, { id: 'f', quantity: 1 }]);
});
test('rejects a shortage rather than accepting a partially reserved paid order', () => {
  assert.throws(() => allocate([{ id: 'l', name: 'Lindau', available: 1 }], 2), /Nicht genügend/);
});
test('excludes other stock locations and negative available quantities', () => {
  assert.throws(() => allocate([{ id: 'x', name: 'Other', available: 100 }, { id: 'l', name: 'Lindau', available: -1 }], 1), /Nicht genügend/);
});
test('second partial fulfillment uses only the remaining allocation', () => {
  assert.deepEqual(remainingAtLocations([{ id: 'l', quantity: 2 }, { id: 'f', quantity: 3 }], [{ id: 'l', quantity: 2 }, { id: 'f', quantity: 1 }]), [{ id: 'f', quantity: 2 }]);
});
test('returned sales cannot be returned a second time', () => {
  assert.deepEqual(remainingAtLocations([{ id: 'l', quantity: 1 }, { id: 'f', quantity: 2 }], [{ id: 'l', quantity: 1 }]), [{ id: 'f', quantity: 2 }]);
});

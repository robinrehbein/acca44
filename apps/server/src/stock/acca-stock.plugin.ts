import { OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, PluginCommonModule, RequestContextCacheService, StockMovementEvent, TransactionalConnection, VendurePlugin } from '@vendure/core';
import { movementPlanKey } from './acca-stock-location-strategy';

/**
 * Vendure 3.8.0 records a split line's total on each Sale/Release/Cancellation row,
 * although it changes StockLevel by each location's actual quantity. Normalize only
 * those movement quantities in the same transaction via the blocking event API.
 * Stock counts themselves are exclusively maintained by Vendure's stock services.
 */
@VendurePlugin({ imports: [PluginCommonModule], compatibility: '^3.8.0' })
export class AccaStockPlugin implements OnApplicationBootstrap {
  constructor(private events: EventBus, private connection: TransactionalConnection, private cache: RequestContextCacheService) {}
  onApplicationBootstrap() {
    this.events.registerBlockingEventHandler({
      id: 'acca44-split-stock-history', event: StockMovementEvent,
      handler: async event => {
        if (!['SALE', 'RELEASE', 'CANCELLATION'].includes(event.type)) return;
        for (const movement of event.stockMovements) {
          const line = (movement as typeof movement & { orderLine?: { id: string | number } }).orderLine;
          if (!line) throw new Error('Stock movement has no order line');
          const quantity = this.cache.get<number>(event.ctx, movementPlanKey(event.type, line.id, movement.stockLocationId ?? movement.stockLocation.id));
          if (quantity === undefined) throw new Error('Stock movement has no allocation plan');
          const signed = event.type === 'SALE' ? -quantity : quantity;
          if (movement.quantity !== signed) {
            movement.quantity = signed;
            await this.connection.getRepository(event.ctx, movement.constructor as any).update(movement.id, { quantity: signed });
          }
        }
      },
    });
  }
}

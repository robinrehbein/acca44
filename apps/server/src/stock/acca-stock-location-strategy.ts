import {
  Allocation, BaseStockLocationStrategy, Cancellation, Injector, LocationWithQuantity,
  OrderLine, ProductVariant, Release, RequestContext, RequestContextCacheService,
  Sale, StockLevel, StockLocation, UserInputError,
} from '@vendure/core';
import { ID } from '@vendure/common/lib/shared-types';
import { allocate, locationPriority, remainingAtLocations } from './policy';

export const movementPlanKey = (type: string, lineId: ID, locationId: ID) => `acca44:${type}:${lineId}:${locationId}`;

/** A single shop with two physical locations; no backorders in this prototype. */
export class AccaStockLocationStrategy extends BaseStockLocationStrategy {
  private requestCache!: RequestContextCacheService;
  init(injector: Injector) {
    super.init(injector);
    this.requestCache = injector.get(RequestContextCacheService);
  }
  private eligible(ctx: RequestContext) {
    return this.connection.getRepository(ctx, StockLocation).createQueryBuilder('location')
      .innerJoin('location.channels', 'channel', 'channel.id = :channelId', { channelId: ctx.channelId })
      .where('location.name IN (:...names)', { names: ['Lindau', 'Friedrichshafen'] }).getMany();
  }
  async getAvailableStock(ctx: RequestContext, _variantId: ID, levels: StockLevel[]) {
    const ids = new Set((await this.eligible(ctx)).map(l => String(l.id)));
    return levels.filter(l => ids.has(String(l.stockLocationId))).reduce((sum, row) => ({
      stockOnHand: sum.stockOnHand + row.stockOnHand,
      stockAllocated: sum.stockAllocated + row.stockAllocated,
    }), { stockOnHand: 0, stockAllocated: 0 });
  }
  async forAllocation(ctx: RequestContext, locations: StockLocation[], line: OrderLine, quantity: number) {
    const variant = await this.connection.getEntityOrThrow(ctx, ProductVariant, line.productVariantId);
    const settings = await this.getVariantStockSettings(ctx, variant);
    const eligibleIds = new Set((await this.eligible(ctx)).map(l => String(l.id)));
    const candidates = locations.filter(l => eligibleIds.has(String(l.id)));
    if (settings.inventoryNotTracked) {
      const location = candidates.sort((a,b) => locationPriority(a.name) - locationPriority(b.name))[0];
      if (!location) throw new UserInputError('Kein Filialbestand eingerichtet.');
      return [{ location, quantity }];
    }
    const levels = await (await this.getStockLevelService()).getLockedStockLevelsForVariant(ctx, line.productVariantId);
    try {
      return allocate(candidates.map(location => {
        const level = levels.find(l => String(l.stockLocationId) === String(location.id));
        return { id: String(location.id), name: location.name, available: level ? level.stockOnHand - level.stockAllocated - Math.max(0, settings.effectiveOutOfStockThreshold) : 0 };
      }), quantity).map(row => ({ location: candidates.find(l => String(l.id) === row.id)!, quantity: row.quantity }));
    } catch (error) { throw new UserInputError((error as Error).message); }
  }
  async forSale(ctx: RequestContext, locations: StockLocation[], line: OrderLine, quantity: number) {
    return this.fromHistory(ctx, locations, line, quantity, 'SALE');
  }
  async forRelease(ctx: RequestContext, locations: StockLocation[], line: OrderLine, quantity: number) {
    return this.fromHistory(ctx, locations, line, quantity, 'RELEASE');
  }
  async forCancellation(ctx: RequestContext, locations: StockLocation[], line: OrderLine, quantity: number) {
    return this.fromHistory(ctx, locations, line, quantity, 'CANCELLATION');
  }
  private async fromHistory(ctx: RequestContext, locations: StockLocation[], line: OrderLine, quantity: number, type: string): Promise<LocationWithQuantity[]> {
    const find = async (entity: typeof Allocation | typeof Sale | typeof Release | typeof Cancellation) => {
      const rows = await this.connection.getRepository(ctx, entity).find({ where: { orderLine: { id: line.id } }, order: { id: 'ASC' } });
      return rows.map(row => ({ id: String(row.stockLocationId), quantity: Math.abs(row.quantity) }));
    };
    const available = type === 'CANCELLATION'
      ? remainingAtLocations(await find(Sale), await find(Cancellation))
      : remainingAtLocations(await find(Allocation), [...await find(Sale), ...await find(Release)]);
    const plan = allocate(locations.map(location => ({ id: String(location.id), name: location.name, available: available.find(row => row.id === String(location.id))?.quantity ?? 0 })), quantity);
    return plan.map(row => {
      const location = locations.find(l => String(l.id) === row.id)!;
      this.requestCache.set(ctx, movementPlanKey(type, line.id, location.id), row.quantity);
      return { location, quantity: row.quantity };
    });
  }
}

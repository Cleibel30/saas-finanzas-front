import { createApiClientWithToken } from '@/src/infrastructure/api/apiClient';
import type { IUnitCostRepository, UnitCostResult, UnitCostProductResult, UnitCostServiceResult } from '@/src/domain/repositories/IUnitCostRepository';

export class UnitCostRepositoryImpl implements IUnitCostRepository {
  private api;

  constructor(token: string) {
    this.api = createApiClientWithToken(token);
  }

  async getByBatch(batchId: string, companyId: string, startDate?: string, endDate?: string): Promise<UnitCostResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.api.get<any>(
      `/unit-cost/batch/${batchId}/${companyId}`,
      { params: { startDate, endDate } },
    );
    return {
      itemId: data.itemId,
      itemName: data.itemName,
      totalCostUSD: data.totalCostUSD,
      totalCostBs: data.totalCostBs,
      totalQuantity: data.quantity,
      weightedAvgUnitCostUSD: data.unitCostUSD,
      weightedAvgUnitCostBs: data.unitCostBs,
    };
  }

  async getByProduct(itemId: string, companyId: string): Promise<UnitCostResult> {
    const { data } = await this.api.get<UnitCostResult>(
      `/unit-cost/product/${itemId}/${companyId}`
    );
    return data;
  }

  async getByService(itemId: string, companyId: string): Promise<UnitCostResult> {
    const { data } = await this.api.get<UnitCostResult>(
      `/unit-cost/service/${itemId}/${companyId}`
    );
    return data;
  }

  async getByProductWithDateRange(itemId: string, companyId: string, startDate: string, endDate: string): Promise<UnitCostProductResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.api.get<any>(
      `/unit-cost/product/${itemId}/${companyId}/${startDate}/${endDate}`
    );
    return {
      itemId: data.itemId,
      itemName: data.itemName,
      totalCostUSD: data.totalCostUSD,
      totalCostBs: data.totalCostBs,
      totalQuantity: data.totalSold,
      weightedAvgUnitCostUSD: data.avgUnitCostUSD,
      weightedAvgUnitCostBs: data.avgUnitCostBs,
      chartData: data.chartData ?? [],
      isValid: data.isValid ?? true,
    };
  }

  async getByServiceWithDateRange(itemId: string, companyId: string, startDate: string, endDate: string): Promise<UnitCostServiceResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.api.get<any>(
      `/unit-cost/service/${itemId}/${companyId}/${startDate}/${endDate}`
    );
    return {
      itemId: data.itemId,
      itemName: data.itemName,
      totalCostUSD: data.totalCostUSD,
      totalCostBs: data.totalCostBs,
      totalQuantity: data.totalSold ?? data.totalServicesSold,
      weightedAvgUnitCostUSD: data.avgUnitCostUSD ?? data.weightedAvgUnitCostUSD,
      weightedAvgUnitCostBs: data.avgUnitCostBs ?? data.weightedAvgUnitCostBs,
      totalServicesSold: data.totalServicesSold ?? data.totalSold,
      chartData: data.chartData ?? [],
      isValid: data.isValid ?? true,
    };
  }
}
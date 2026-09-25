export interface UnitCostResult {
  itemId: string;
  itemName: string;
  totalCostUSD: number;
  totalCostBs: number;
  totalQuantity: number;
  weightedAvgUnitCostUSD: number;
  weightedAvgUnitCostBs: number;
}

export interface ChartDataPoint {
  period: string;
  unitCostUSD: number;
  unitCostBs: number;
  totalCostUSD: number;
  totalCostBs: number;
  quantity: number;
}

export interface UnitCostProductResult extends UnitCostResult {
  chartData: ChartDataPoint[];
  isValid: boolean;
}

export interface UnitCostServiceResult extends UnitCostResult {
  totalServicesSold: number;
  chartData: ChartDataPoint[];
  isValid: boolean;
}

export interface IUnitCostRepository {
  getByBatch(batchId: string, companyId: string, startDate?: string, endDate?: string): Promise<UnitCostResult>;
  getByProduct(itemId: string, companyId: string): Promise<UnitCostResult>;
  getByService(itemId: string, companyId: string): Promise<UnitCostResult>;
  getByProductWithDateRange(itemId: string, companyId: string, startDate: string, endDate: string): Promise<UnitCostProductResult>;
  getByServiceWithDateRange(itemId: string, companyId: string, startDate: string, endDate: string): Promise<UnitCostServiceResult>;
}
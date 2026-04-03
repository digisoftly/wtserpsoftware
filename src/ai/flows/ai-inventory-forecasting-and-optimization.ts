'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-powered inventory forecasting and optimization.
 *
 * - inventoryForecasting - A function that analyzes historical sales and current inventory to predict future demand and provide stock optimization recommendations.
 * - InventoryForecastingInput - The input type for the inventoryForecasting function.
 * - InventoryForecastingOutput - The return type for the inventoryForecasting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InventoryForecastingInputSchema = z.object({
  historicalSalesData: z.array(
    z.object({
      date: z.string().describe('ISO date string of the sale'),
      productId: z.string().describe('ID of the product sold'),
      quantitySold: z.number().describe('Quantity of the product sold'),
    })
  ).describe('Historical sales records including date, product ID, and quantity sold.'),
  currentInventory: z.array(
    z.object({
      productId: z.string().describe('ID of the product'),
      currentStock: z.number().describe('Current quantity in stock'),
      reorderPoint: z.number().describe('Current reorder point'),
      maxStockLevel: z.number().describe('Current maximum stock level'),
    })
  ).describe('Current inventory status for each product.'),
  productCatalog: z.array(
    z.object({
      productId: z.string().describe('ID of the product'),
      productName: z.string().describe('Name of the product'),
      unitCost: z.number().describe('Cost per unit'),
      unitPrice: z.number().describe('Selling price per unit'),
    })
  ).describe('Catalog of products with their details.'),
});
export type InventoryForecastingInput = z.infer<typeof InventoryForecastingInputSchema>;

const InventoryForecastingOutputSchema = z.object({
  forecasts: z.array(
    z.object({
      productId: z.string().describe('ID of the product'),
      productName: z.string().describe('Name of the product'),
      predictedDemandNextPeriod: z.number().describe('Predicted demand for the next period (e.g., next month/quarter)'),
      recommendedStockLevel: z.number().describe('Recommended optimal stock level'),
      recommendedReorderPoint: z.number().describe('Recommended reorder point'),
    })
  ).describe('Demand forecasts and recommended stock levels/reorder points for each product.'),
  explanation: z.string().describe('A detailed explanation of the forecasting methodology, key factors considered, and the rationale behind the recommendations.'),
  recommendations: z.array(
    z.string().describe('Actionable recommendations for stock optimization, e.g., "Increase reorder point for Product X to Y units due to increasing demand trends."')
  ).describe('A list of actionable steps for inventory optimization.'),
});
export type InventoryForecastingOutput = z.infer<typeof InventoryForecastingOutputSchema>;

export async function inventoryForecasting(input: InventoryForecastingInput): Promise<InventoryForecastingOutput> {
  return inventoryForecastingFlow(input);
}

const inventoryForecastingPrompt = ai.definePrompt({
  name: 'inventoryForecastingPrompt',
  input: { schema: InventoryForecastingInputSchema },
  output: { schema: InventoryForecastingOutputSchema },
  prompt: `You are an expert inventory manager and supply chain analyst. Your task is to analyze historical sales data and current inventory levels to forecast future demand and provide actionable recommendations for optimizing stock levels and reorder points.

Analyze the following data:

Historical Sales Data:
{{#each historicalSalesData}}
  - Date: {{this.date}}, Product ID: {{this.productId}}, Quantity Sold: {{this.quantitySold}}
{{/each}}

Current Inventory Status:
{{#each currentInventory}}
  - Product ID: {{this.productId}}, Current Stock: {{this.currentStock}}, Reorder Point: {{this.reorderPoint}}, Max Stock Level: {{this.maxStockLevel}}
{{/each}}

Product Catalog:
{{#each productCatalog}}
  - Product ID: {{this.productId}}, Product Name: {{this.productName}}, Unit Cost: {{this.unitCost}}, Unit Price: {{this.unitPrice}}
{{/each}}

Based on this data, provide:
1.  A forecast for the predicted demand for each product for the next period.
2.  Recommended optimal stock levels for each product.
3.  Recommended reorder points for each product.
4.  A detailed explanation of your analysis and reasoning behind the forecasts and recommendations.
5.  A list of actionable recommendations for inventory optimization.

Ensure the output is in a structured JSON format matching the defined output schema.`,
});

const inventoryForecastingFlow = ai.defineFlow(
  {
    name: 'inventoryForecastingFlow',
    inputSchema: InventoryForecastingInputSchema,
    outputSchema: InventoryForecastingOutputSchema,
  },
  async (input) => {
    const { output } = await inventoryForecastingPrompt(input);
    return output!;
  }
);

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
import { DatabaseResources } from "./database-resources.js";
import { LambdaResources } from "./lambda-resources.js";
import { ApiGatewayResources } from "./api-gateway-resources.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.PRODUCTS_TABLE || !process.env.STOCKS_TABLE) {
  throw new Error("Cannot proceed without table names");
}

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databaseLayer = new DatabaseResources(this, "DatabaseLayer", {
      productsTable: process.env.PRODUCTS_TABLE as string,
      stocksTable: process.env.STOCKS_TABLE as string,
    });

    const lambdaLayer = new LambdaResources(this, "LambdaLayer", {
      productsTable: databaseLayer.productsTable,
      stocksTable: databaseLayer.stocksTable,
    });

    const apiGatewayLayer = new ApiGatewayResources(this, "ApiGatewayLayer", {
      getProductsList: lambdaLayer.getProductsList,
      getProductById: lambdaLayer.getProductById,
      createProduct: lambdaLayer.createProduct,
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value:
        apiGatewayLayer.httpApi.apiEndpoint ??
        "Something went wrong with the endpoint",
      description: "The URL of the Product Service API",
    });
  }
}

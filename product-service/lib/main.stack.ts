import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatabaseResources } from "./database-resources.js";
import { LambdaResources } from "./lambda-resources.js";
import { ApiGatewayResources } from "./api-gateway-resources.js";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databaseLayer = new DatabaseResources(this, "DatabaseLayer");

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

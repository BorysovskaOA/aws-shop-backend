import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { S3Resources } from "./s3-resources";
import { LambdaResources } from "./lambda-resources";
import { ApiGatewayResources } from "./api-gateway-resources";
import { SqsResources } from "./sqs-resources";
import { SnsResources } from "./sns-resources";
import { DatabaseResources } from "./database-resources";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Layer = new S3Resources(this, "S3Layer");
    const sqsLayer = new SqsResources(this, "SQSLayer");
    const snsLayer = new SnsResources(this, "SNSLayer");
    const databaseLayer = new DatabaseResources(this, "DatabaseLayer");

    const lambdaLayer = new LambdaResources(this, "LambdaLayer", {
      bucket: s3Layer.s3Bucket,
      uploadedFolder: s3Layer.uploadedFolder,
      parsedFolder: s3Layer.parsedFolder,
      queue: sqsLayer.queue,
      topic: snsLayer.topic,
      productsTable: databaseLayer.productsTable,
      stocksTable: databaseLayer.stocksTable,
    });

    const authorizerLambdaArn = cdk.Fn.importValue("SharedBasicAuthorizerArn");

    const apiGatewayLayer = new ApiGatewayResources(this, "ApiGatewayLayer", {
      importProductsFile: lambdaLayer.importProductsFile,
      authorizerLambdaArn: authorizerLambdaArn,
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value:
        apiGatewayLayer.httpApi.apiEndpoint ??
        "Something went wrong with the endpoint",
      description: "The URL of the Import Service API",
    });
  }
}

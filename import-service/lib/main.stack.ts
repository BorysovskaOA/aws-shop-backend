import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { S3Resources } from "./s3-resources";
import { LambdaResources } from "./lambda-resources";
import { ApiGatewayResources } from "./api-gateway-resources";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Layer = new S3Resources(this, "S3Layer");

    const lambdaLayer = new LambdaResources(this, "LambdaLayer", {
      bucket: s3Layer.s3Bucket,
      uploadedFolder: s3Layer.uploadedFolder,
      parsedFolder: s3Layer.parsedFolder,
    });

    const apiGatewayLayer = new ApiGatewayResources(this, "ApiGatewayLayer", {
      importProductsFile: lambdaLayer.importProductsFile,
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value:
        apiGatewayLayer.httpApi.apiEndpoint ??
        "Something went wrong with the endpoint",
      description: "The URL of the Import Service API",
    });
  }
}

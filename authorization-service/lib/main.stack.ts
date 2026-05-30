import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: lambda.IFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envPath = path.join(__dirname, "../.env");
    let lambdaEnv: Record<string, string> = {};

    if (fs.existsSync(envPath)) {
      const parsedEnv = dotenv.parse(fs.readFileSync(envPath));
      for (const [key, value] of Object.entries(parsedEnv)) {
        lambdaEnv[key] = value;
      }
    }

    this.basicAuthorizer = new NodejsFunction(this, "BasicAuthorizer", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        ...lambdaEnv,
      },
      bundling: {
        tsconfig: path.resolve(__dirname, "../tsconfig.json"),
        minify: true,
        sourceMap: true,
        bundleAwsSDK: true,
      },
      timeout: cdk.Duration.seconds(10),
      entry: path.join(__dirname, "../src/functions/basicAuthorizer/index.ts"),
      handler: "basicAuthorizer",
      logGroup: new logs.LogGroup(this, "BasicAuthorizerLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    new cdk.CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: this.basicAuthorizer.functionArn,
      exportName: "SharedBasicAuthorizerArn",
    });
  }
}

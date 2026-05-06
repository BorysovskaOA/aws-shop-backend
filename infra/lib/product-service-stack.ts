import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as logs from "aws-cdk-lib/aws-logs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../product-service/.env") });

if (!process.env.PRODUCTS_TABLE || !process.env.STOCKS_TABLE) {
  throw new Error("Cannot proceed without table names");
}

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      process.env.PRODUCTS_TABLE as string,
    );
    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      process.env.STOCKS_TABLE as string,
    );

    const sharedLambdaProps = {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
      bundling: {
        projectRoot: path.join(__dirname, "../../"),
        depsLockFilePath: path.join(__dirname, "../../package-lock.json"),
        tsconfig: path.resolve(
          __dirname,
          "../../product-service/tsconfig.json",
        ),
        minify: true,
        sourceMap: true,
        bundleAwsSDK: true,
      },
    };

    const getProductsList = new NodejsFunction(this, "GetProductsList", {
      ...sharedLambdaProps,
      entry: path.join(
        __dirname,
        "../../product-service/src/functions/getProductsList/index.ts",
      ),
      handler: "getProductsList",
      logGroup: new logs.LogGroup(this, "GetProductsListLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    const getProductById = new NodejsFunction(this, "GetProductById", {
      ...sharedLambdaProps,
      entry: path.join(
        __dirname,
        "../../product-service/src/functions/getProductById/index.ts",
      ),
      handler: "getProductById",
      logGroup: new logs.LogGroup(this, "GetProductByIdLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    productsTable.grantReadData(getProductById);
    stocksTable.grantReadData(getProductById);

    const createProduct = new NodejsFunction(this, "CreateProduct", {
      ...sharedLambdaProps,
      entry: path.join(
        __dirname,
        "../../product-service/src/functions/createProduct/index.ts",
      ),
      handler: "createProduct",
      logGroup: new logs.LogGroup(this, "CreateProductLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

    const httpApi = new apigw.HttpApi(this, "ProductsApi", {
      apiName: "Product Service",
      createDefaultStage: false,
      corsPreflight: {
        allowMethods: [apigw.CorsHttpMethod.GET],
        allowOrigins: [
          "http://localhost:3000",
          "https://d180fy39z34bng.cloudfront.net",
        ],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    new apigw.HttpStage(this, "DefaultStage", {
      httpApi: httpApi,
      stageName: "$default",
      autoDeploy: true,
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
    });

    httpApi.addRoutes({
      path: "/products",
      methods: [apigw.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        getProductsList,
      ),
    });

    httpApi.addRoutes({
      path: "/products",
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateProductIntegration",
        createProduct,
      ),
    });

    httpApi.addRoutes({
      path: "/products/{productId}",
      methods: [apigw.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetProductByIdIntegration",
        getProductById,
      ),
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: httpApi.apiEndpoint ?? "Something went wrong with the endpoint",
      description: "The URL of the Product Service API",
    });
  }
}

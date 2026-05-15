import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LambdaResourcesProps {
  productsTable: dynamodb.ITable;
  stocksTable: dynamodb.ITable;
}

export class LambdaResources extends Construct {
  public readonly getProductsList: NodejsFunction;
  public readonly getProductById: NodejsFunction;
  public readonly createProduct: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaResourcesProps) {
    super(scope, id);

    const sharedLambdaProps = {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        PRODUCTS_TABLE: props.productsTable.tableName,
        STOCKS_TABLE: props.stocksTable.tableName,
      },
      bundling: {
        projectRoot: path.join(__dirname, "../../"),
        depsLockFilePath: path.join(__dirname, "../../package-lock.json"),
        tsconfig: path.resolve(__dirname, "../tsconfig.json"),
        minify: true,
        sourceMap: true,
        bundleAwsSDK: true,
      },
    };

    this.getProductsList = new NodejsFunction(this, "GetProductsList", {
      ...sharedLambdaProps,
      entry: path.join(__dirname, "../src/functions/getProductsList/index.ts"),
      handler: "getProductsList",
      logGroup: new logs.LogGroup(this, "GetProductsListLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    props.productsTable.grantReadData(this.getProductsList);
    props.stocksTable.grantReadData(this.getProductsList);

    this.getProductById = new NodejsFunction(this, "GetProductById", {
      ...sharedLambdaProps,
      entry: path.join(__dirname, "../src/functions/getProductById/index.ts"),
      handler: "getProductById",
      logGroup: new logs.LogGroup(this, "GetProductByIdLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    props.productsTable.grantReadData(this.getProductById);
    props.stocksTable.grantReadData(this.getProductById);

    this.createProduct = new NodejsFunction(this, "CreateProduct", {
      ...sharedLambdaProps,
      entry: path.join(__dirname, "../src/functions/createProduct/index.ts"),
      handler: "createProduct",
      logGroup: new logs.LogGroup(this, "CreateProductLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    props.productsTable.grantWriteData(this.createProduct);
    props.stocksTable.grantWriteData(this.createProduct);
  }
}

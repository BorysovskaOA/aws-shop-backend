import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LambdaResourcesProps {
  bucket: s3.Bucket;
  uploadedFolder: string;
  parsedFolder: string;
}

export class LambdaResources extends Construct {
  public readonly importProductsFile: NodejsFunction;
  public readonly importFileParser: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaResourcesProps) {
    super(scope, id);

    const sharedLambdaProps = {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
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

    this.importProductsFile = new NodejsFunction(this, "ImportProductsFile", {
      ...sharedLambdaProps,
      environment: {
        ...sharedLambdaProps.environment,
        BUCKET_NAME: props.bucket.bucketName,
        UPLOADED_FOLDER: props.uploadedFolder,
      },
      timeout: cdk.Duration.seconds(10),
      entry: path.join(
        __dirname,
        "../src/functions/importProductsFile/index.ts",
      ),
      handler: "importProductsFile",
      logGroup: new logs.LogGroup(this, "ImportProductsFileLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    props.bucket.grantPut(this.importProductsFile, `${props.uploadedFolder}/*`);

    this.importFileParser = new NodejsFunction(this, "ImportFileParser", {
      ...sharedLambdaProps,
      environment: {
        ...sharedLambdaProps.environment,
        PARSED_FOLDER: props.parsedFolder,
      },
      timeout: cdk.Duration.minutes(5),
      entry: path.join(__dirname, "../src/functions/importFileParser/index.ts"),
      handler: "importFileParser",
      logGroup: new logs.LogGroup(this, "ImportFileParserLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    props.bucket.grantRead(this.importFileParser, `${props.uploadedFolder}/*`);
    props.bucket.grantDelete(
      this.importFileParser,
      `${props.uploadedFolder}/*`,
    );
    props.bucket.grantPut(this.importFileParser, `${props.parsedFolder}/*`);

    props.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.importFileParser),
      { prefix: `${props.uploadedFolder}/` },
    );
  }
}

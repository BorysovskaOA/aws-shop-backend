import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3Resources extends Construct {
  public readonly s3Bucket: s3.Bucket;
  public readonly uploadedFolder = "uploaded";
  public readonly parsedFolder = "parsed";
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.s3Bucket = new s3.Bucket(this, "ImportProductsBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: [
            "http://localhost:3000",
            "https://d180fy39z34bng.cloudfront.net",
          ],
          allowedHeaders: ["*"],
        },
      ],
    });
  }
}

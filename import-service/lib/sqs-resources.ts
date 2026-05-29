import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class SqsResources extends Construct {
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const deadLetterQueve = new sqs.Queue(this, "CatalogItemsDLQueue", {
      enforceSSL: true,
      retentionPeriod: cdk.Duration.days(7),
    });

    this.queue = new sqs.Queue(this, "CatalogItemsQueue", {
      enforceSSL: true,
      visibilityTimeout: cdk.Duration.seconds(150),
      deadLetterQueue: {
        queue: deadLetterQueve,
        maxReceiveCount: 3,
      },
    });
  }
}

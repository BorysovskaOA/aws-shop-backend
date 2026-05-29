import * as sns from "aws-cdk-lib/aws-sns";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class SnsResources extends Construct {
  public readonly topic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.topic = new sns.Topic(this, "CreateProductTopic", {
      enforceSSL: true,
      displayName: "New products created",
    });

    const adminEmail = ssm.StringParameter.valueForStringParameter(
      this,
      "/config/prod/alerts/admin-email",
    );
    const expensiveProductEmail = ssm.StringParameter.valueForStringParameter(
      this,
      "/config/prod/alerts/expensive-product-email",
    );

    this.topic.addSubscription(new subscriptions.EmailSubscription(adminEmail));

    this.topic.addSubscription(
      new subscriptions.EmailSubscription(expensiveProductEmail, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThanOrEqualTo: 100,
          }),
        },
      }),
    );
  }
}

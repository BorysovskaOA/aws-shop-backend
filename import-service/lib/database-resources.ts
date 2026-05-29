import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class DatabaseResources extends Construct {
  public readonly productsTable: dynamodb.ITable;
  public readonly stocksTable: dynamodb.ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const productsTableName = ssm.StringParameter.valueForStringParameter(
      this,
      "/config/prod/dynamoDbTable/products",
    );

    const stocksTableName = ssm.StringParameter.valueForStringParameter(
      this,
      "/config/prod/dynamoDbTable/stocks",
    );

    this.productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      productsTableName,
    );

    this.stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      stocksTableName,
    );
  }
}

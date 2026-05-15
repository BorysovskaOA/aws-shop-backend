import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface DatabaseResourcesProps {
  productsTable: string;
  stocksTable: string;
}

export class DatabaseResources extends Construct {
  public readonly productsTable: dynamodb.ITable;
  public readonly stocksTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props: DatabaseResourcesProps) {
    super(scope, id);

    this.productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      props.productsTable,
    );

    this.stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      props.stocksTable,
    );
  }
}

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const Table = {
  Products: process.env.PRODUCTS_TABLE as string,
  Stocks: process.env.STOCKS_TABLE as string,
};

const client = new DynamoDBClient();
export const dynamoDBClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

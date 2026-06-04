import { Book, BookDB, BookInStockDB } from "common/interfaces/book";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { dynamoDBClient, Table } from "common/dynamoDbClient";
import { withCatchError } from "common/utils/withCatchError";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "common/utils/formatResponse";
import { CreateProductSchema } from "common/schemas/create-product.schema";

export const createProduct = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    console.log("Create product", JSON.stringify(event));

    const body = JSON.parse(event.body || "{}");

    const validation = CreateProductSchema.safeParse(body);
    if (!validation.success) {
      return formatErrorResponse(
        z.treeifyError(validation.error).properties,
        400,
      );
    }

    const { title, description, price, count } = validation.data;

    const id = randomUUID();
    const book: BookDB = { id, title, price, description };
    const bookInStock: BookInStockDB = { product_id: id, count: count || 0 };

    await dynamoDBClient.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: Table.Products, Item: book } },
          { Put: { TableName: Table.Stocks, Item: bookInStock } },
        ],
      }),
    );

    const result: Book = { ...book, count: count ?? 0 };

    return formatSuccessResponse(result, 201);
  },
);

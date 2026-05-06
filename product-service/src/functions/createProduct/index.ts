import { Book, BookDB, BookInStockDB } from "product-service/src/interfaces";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { z } from "zod";
import crypto from "node:crypto";
import {
  dynamoDBClient,
  Table,
} from "product-service/src/common/dynamoDbClient";
import { withCatchError } from "product-service/src/utils/withCatchError";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "product-service/src/utils/formatResponse";

const CreateProductSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.number().int().positive(),
  count: z.number().int().nonnegative().default(0),
});

export const createProduct = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    const body = JSON.parse(event.body || "{}");

    const validation = CreateProductSchema.safeParse(body);

    if (!validation.success) {
      return formatErrorResponse(
        z.treeifyError(validation.error).properties,
        400,
      );
    }

    const { title, description, price, count } = validation.data;

    const id = crypto.randomUUID();
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

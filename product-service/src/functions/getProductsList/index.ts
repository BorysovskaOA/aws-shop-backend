import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBClient, Table } from "common/dynamoDbClient";
import { formatSuccessResponse } from "common/utils/formatResponse";
import { withCatchError } from "common/utils/withCatchError";
import { Book, BookDB, BookInStockDB } from "common/interfaces/book";
import { APIGatewayProxyEvent } from "aws-lambda";

export const getProductsList = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    console.log("Get products list", JSON.stringify(event));

    const [productsResponse, stocksResponse] = await Promise.all([
      dynamoDBClient.send(new ScanCommand({ TableName: Table.Products })),
      dynamoDBClient.send(new ScanCommand({ TableName: Table.Stocks })),
    ]);

    const books: BookDB[] = (productsResponse.Items as BookDB[]) || [];
    const booksInStock: BookInStockDB[] =
      (stocksResponse.Items as BookInStockDB[]) || [];

    const result: Book[] = books.map((book) => {
      const bookInStock = booksInStock.find((s) => s.product_id === book.id);

      return {
        ...book,
        count: bookInStock?.count ?? 0,
      };
    });

    return formatSuccessResponse(result);
  },
);

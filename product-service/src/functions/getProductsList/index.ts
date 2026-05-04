import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBClient, Table } from "../../common/dynamoDbClient";
import { formatSuccessResponse } from "../../utils/formatResponse";
import { withCatchError } from "../../utils/withCatchError";
import { Book, BookDB, BookInStockDB } from "../../interfaces";

export const getProductsList = withCatchError(async () => {
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
});

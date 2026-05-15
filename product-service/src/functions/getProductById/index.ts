import { APIGatewayProxyEvent } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../../utils/formatResponse";
import { withCatchError } from "../../utils/withCatchError.js";
import { dynamoDBClient, Table } from "../../common/dynamoDbClient";
import { Book, BookDB, BookInStockDB } from "../../interfaces";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getProductById = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    console.log("Get product by id", event);

    const productId = event.pathParameters?.productId;
    if (!productId || !UUID_REGEX.test(productId)) {
      return formatErrorResponse(`Invalid format ${productId}`, 400);
    }

    const [productsResponse, stocksResponse] = await Promise.all([
      dynamoDBClient.send(
        new GetCommand({ TableName: Table.Products, Key: { id: productId } }),
      ),
      dynamoDBClient.send(
        new GetCommand({
          TableName: Table.Stocks,
          Key: { product_id: productId },
        }),
      ),
    ]);

    const book = productsResponse.Item as BookDB;
    const bookInStock = stocksResponse.Item as BookInStockDB;

    if (!book) {
      return formatErrorResponse(`Product ${productId} is not found`, 404);
    }

    const result: Book = {
      ...book,
      count: bookInStock?.count ?? 0,
    };

    return formatSuccessResponse(result);
  },
);

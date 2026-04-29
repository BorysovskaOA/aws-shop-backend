import { APIGatewayProxyEvent } from "aws-lambda";
import { products } from "../../products";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../../utils/formatResponse";
import { withCatchError } from "../../utils/withCatchError.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getProductById = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    const productId = event.pathParameters?.productId;

    if (!productId || !UUID_REGEX.test(productId)) {
      return formatErrorResponse(`Invalid format ${productId}`, 400);
    }

    const product = products.find((p) => p.id === productId);

    if (!product) {
      return formatErrorResponse(`Product ${productId} is not found`, 404);
    }

    return formatSuccessResponse(product);
  },
);

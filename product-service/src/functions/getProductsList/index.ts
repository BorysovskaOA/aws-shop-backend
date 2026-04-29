import { products } from "../../products";
import { formatSuccessResponse } from "../../utils/formatResponse";
import { withCatchError } from "../../utils/withCatchError";

export const getProductsList = withCatchError(async () => {
  return formatSuccessResponse(products);
});

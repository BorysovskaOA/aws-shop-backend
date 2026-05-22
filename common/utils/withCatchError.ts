import { APIGatewayProxyResult } from "aws-lambda";
import { formatErrorResponse } from "./formatResponse.js";

export const withCatchError = <T, Args extends any[]>(
  func: (...args: Args) => Promise<T>,
) => {
  return async (...args: Args): Promise<T | APIGatewayProxyResult> => {
    try {
      return await func(...args);
    } catch (err) {
      console.error("[ERROR]", err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      return formatErrorResponse(errorMessage, 500);
    }
  };
};

import http from "node:http";
import { APIGatewayProxyResult } from "aws-lambda";

export const formatErrorResponse = (
  description: any,
  statusCode: number,
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: http.STATUS_CODES[statusCode] || "Unknown Error",
      description,
    }),
  };
};

export const formatSuccessResponse = (
  data: any,
  statusCode: number = 200,
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
};

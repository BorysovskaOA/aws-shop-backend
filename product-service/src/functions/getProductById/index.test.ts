import crypto from "node:crypto";
import { it, describe, expect, vi, beforeEach } from "vitest";
import { getProductById } from "./index";
import { dynamoDBClient } from "common/dynamoDbClient";

const product = {
  id: "99999999-9999-4999-9999-999999999999",
  title: "Mocked Book",
  price: 10,
  description: "Test",
};

const stock = {
  product_id: "99999999-9999-4999-9999-999999999999",
  count: 3,
};

vi.mock("common/dynamoDbClient", () => ({
  dynamoDBClient: {
    send: vi.fn(),
  },
  Table: {
    Products: "test_products",
    Stocks: "test_stocks",
  },
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  GetCommand: vi.fn(),
}));

describe("Get Product By ID Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 200 and the correct product for a valid ID", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "99999999-9999-4999-9999-999999999999",
      },
    } as any;

    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Item: product,
    } as any);
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Item: stock,
    } as any);

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toEqual("99999999-9999-4999-9999-999999999999");
    expect(body.title).toEqual("Mocked Book");
    expect(body.description).toEqual("Test");
    expect(body.price).toEqual(10);
    expect(body.count).toEqual(3);
  });

  it("should return 200 with default count if not found in stock", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "99999999-9999-4999-9999-999999999999",
      },
    } as any;

    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Item: product,
    } as any);
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Item: undefined,
    } as any);

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toEqual("99999999-9999-4999-9999-999999999999");
    expect(body.title).toEqual("Mocked Book");
    expect(body.description).toEqual("Test");
    expect(body.price).toEqual(10);
    expect(body.count).toEqual(0);
  });

  it("should return 400 if productId is not a valid UUID", async () => {
    const mockEvent = {
      pathParameters: { productId: "invalid-id" },
    } as any;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toEqual("Bad Request");
    expect(body.description).toBeDefined();
  });

  it("should return 404 if product does not exist", async () => {
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Item: undefined,
    } as any);
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Item: undefined,
    } as any);
    const mockEvent = {
      pathParameters: { productId: crypto.randomUUID() },
    } as any;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toEqual("Not Found");
    expect(body.description).toBeDefined();
  });
});

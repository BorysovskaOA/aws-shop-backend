import { it, describe, expect, vi, beforeEach } from "vitest";
import { getProductsList } from "./index";
import { dynamoDBClient } from "product-service/src/common/dynamoDbClient";

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

vi.mock("../../common/dynamoDbClient", () => ({
  dynamoDBClient: {
    send: vi.fn(),
  },
  Table: {
    Products: "test_products",
    Stocks: "test_stocks",
  },
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  ScanCommand: vi.fn(),
}));

describe("Get Products List Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 200 and list of products", async () => {
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Items: [product],
    } as any);
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Items: [stock],
    } as any);

    const response = await getProductsList();

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual([
      {
        id: "99999999-9999-4999-9999-999999999999",
        title: "Mocked Book",
        price: 10,
        description: "Test",
        count: 3,
      },
    ]);
  });

  it("should return 200 and ldefault value in count if not found in stock", async () => {
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Items: [product],
    } as any);
    vi.mocked(dynamoDBClient.send).mockResolvedValueOnce({
      Items: [],
    } as any);

    const response = await getProductsList();

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual([
      {
        id: "99999999-9999-4999-9999-999999999999",
        title: "Mocked Book",
        price: 10,
        description: "Test",
        count: 0,
      },
    ]);
  });
});

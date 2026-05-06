import { it, describe, expect, vi, beforeEach } from "vitest";
import { createProduct } from "./index";
import { dynamoDBClient } from "product-service/src/common/dynamoDbClient";

const createData = {
  title: "Mocked Book",
  price: 10,
  description: "Test",
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
  TransactWriteCommand: vi.fn(),
}));

describe("Create Product Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 201 and created product", async () => {
    const mockEvent = {
      body: JSON.stringify(createData),
    } as any;

    const response = await createProduct(mockEvent);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toEqual({
      id: expect.any(String),
      ...createData,
    });
  });

  it("should return 201 for product without description or count", async () => {
    const mockEvent = {
      body: JSON.stringify({
        title: createData.title,
        price: createData.price,
      }),
    } as any;

    const response = await createProduct(mockEvent);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toEqual({
      id: expect.any(String),
      title: createData.title,
      price: createData.price,
      count: 0,
    });
  });

  it("should return 400 for invalid validation for existing fields", async () => {
    const mockEvent = {
      body: JSON.stringify({
        title: 5,
        description: 4,
        price: `${createData.price}`,
        count: -1,
      }),
    } as any;

    const response = await createProduct(mockEvent);

    expect(response.statusCode).toBe(400);
    const { description } = JSON.parse(response.body);
    expect(description.properties).toEqual({
      title: { errors: ["Invalid input: expected string, received number"] },
      description: {
        errors: ["Invalid input: expected string, received number"],
      },
      price: { errors: ["Invalid input: expected number, received string"] },
      count: { errors: ["Too small: expected number to be >=0"] },
    });
  });
});

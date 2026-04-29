import crypto from "node:crypto";
import { it, describe, expect, vi } from "vitest";
import { getProductById } from "./index";

vi.mock("../../products", () => ({
  products: [
    {
      id: "99999999-9999-4999-9999-999999999999",
      title: "Mocked Book",
      price: 10,
      description: "Test",
    },
  ],
}));

describe("Get Product By ID Handler", () => {
  it("should return 200 and the correct product for a valid ID", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "99999999-9999-4999-9999-999999999999",
      },
    } as any;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toEqual("99999999-9999-4999-9999-999999999999");
    expect(body.title).toEqual("Mocked Book");
    expect(body.description).toEqual("Test");
    expect(body.price).toEqual(10);
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

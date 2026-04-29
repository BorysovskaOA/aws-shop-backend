import { it, describe, expect, vi } from "vitest";
import { getProductsList } from "./index";

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

describe("Get Products List Handler", () => {
  it("should return 200 and list of products", async () => {
    const response = await getProductsList();

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual([
      {
        id: "99999999-9999-4999-9999-999999999999",
        title: "Mocked Book",
        price: 10,
        description: "Test",
      },
    ]);
  });
});

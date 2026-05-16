import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { importProductsFile } from "./index";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { afterEach } from "node:test";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://mock-presigned-url.com"),
}));

const s3Mock = mockClient(S3Client);

describe("importProductsFile Lambda Handler", () => {
  beforeEach(() => {
    s3Mock.reset();
    vi.clearAllMocks();
    vi.stubEnv("BUCKET_NAME", "bucket");
    vi.stubEnv("UPLOADED_FOLDER", "uploaded");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should successfully return a 200 response with the signed upload link", async () => {
    const mockEvent = {
      queryStringParameters: {
        name: "products-list.csv",
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await importProductsFile(mockEvent);

    console.log(response.statusCode, response.body);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.url).toBe("https://mock-presigned-url.com");

    expect(getSignedUrl).toHaveBeenCalledTimes(1);

    const [, passedCommand] = vi.mocked(getSignedUrl).mock.calls[0];
    expect((passedCommand.input as any).Bucket).toBe("bucket");
    expect((passedCommand.input as any).Key).toBe("uploaded/products-list.csv");
  });

  it("should return an error fallback response if the filename parameter is missing", async () => {
    const mockEvent = {
      queryStringParameters: null,
    } as APIGatewayProxyEvent;

    const response = await importProductsFile(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0);
  });
});

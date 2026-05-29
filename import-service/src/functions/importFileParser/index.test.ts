import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { importFileParser } from "./index";
import { Readable } from "node:stream";
import { S3Event } from "aws-lambda";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const s3Mock = mockClient(S3Client);
const sqsMock = mockClient(SQSClient);

describe("importFileParser Lambda Handler", () => {
  beforeEach(() => {
    s3Mock.reset();
    vi.stubEnv("PARSED_FOLDER", "parsed");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should successfully parse a valid CSV and send messages", async () => {
    const mockCsv =
      "title,description,price,count\nTitle,Description,20,3\nTitle2,Description2,33,20\n";
    const mockStream = Readable.from([mockCsv]);

    s3Mock.on(GetObjectCommand).resolves({
      Body: mockStream as any,
    });
    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({});

    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: { name: "bucket" },
            object: { key: "uploaded/products-test.csv" },
          },
        },
      ],
    } as S3Event;

    try {
      await importFileParser(mockEvent);
    } catch (err) {
      console.log(err);
    }

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);

    const sqsCalls = sqsMock.commandCalls(SendMessageCommand);
    expect(sqsCalls).toHaveLength(2);

    const firstMsgBody = JSON.parse(
      sqsCalls[0].args[0].input.MessageBody as string,
    );
    expect(firstMsgBody.title).toBe("Title");

    const secondMsgBody = JSON.parse(
      sqsCalls[1].args[0].input.MessageBody as string,
    );
    expect(secondMsgBody.title).toBe("Title2");

    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);

    const copyArgs = s3Mock.commandCall(0, CopyObjectCommand).args[0].input;
    expect(copyArgs.Key).toBe("parsed/products-test.csv");
  });

  it("should catch validation errors from Zod and fail-fast without moving the file", async () => {
    const invalidCsv =
      "title,description,price,count\nTitle,Description,-50,3\n";
    s3Mock
      .on(GetObjectCommand)
      .resolves({ Body: Readable.from([invalidCsv]) as any });

    const mockEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: { name: "bucket" },
            object: { key: "uploaded/bad-products.csv" },
          },
        },
      ],
    } as S3Event;

    await importFileParser(mockEvent);

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(0);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);
  });
});

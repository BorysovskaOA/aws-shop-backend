import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { catalogBatchProcess } from "./index";
import { SQSEvent } from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBClient } from "common/dynamoDbClient";

const dynamoDbMock = mockClient(dynamoDBClient);
const snsMock = mockClient(SNSClient);

describe("catalogBatchProcess Lambda Handler", () => {
  beforeEach(() => {
    dynamoDbMock.resetHistory();
    snsMock.resetHistory();
  });

  it("should successfully process all SQS messages", async () => {
    dynamoDbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const mockEvent = {
      Records: [
        {
          messageId: "msg-1",
          body: JSON.stringify({
            title: "Title",
            price: 40,
            description: "Description",
            count: 5,
          }),
        },
        {
          messageId: "msg-2",
          body: JSON.stringify({
            title: "Title2",
            price: 45,
            description: "Description2",
            count: 2,
          }),
        },
      ],
    } as unknown as SQSEvent;

    const result = await catalogBatchProcess(mockEvent);

    expect(result.batchItemFailures).toHaveLength(0);
    expect(dynamoDbMock.commandCalls(TransactWriteCommand)).toHaveLength(2);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(2);
  });

  it("should catch failures, track batchItemFailures for bad records, and still send SNS for good ones", async () => {
    dynamoDbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const mockMixedEvent = {
      Records: [
        {
          messageId: "good-msg",
          body: JSON.stringify({
            title: "Title",
            price: 10,
            description: "Description",
            count: 1,
          }),
        },
        {
          messageId: "bad-msg",
          body: JSON.stringify({ title: "", price: "not-a-number" }),
        },
      ],
    } as unknown as SQSEvent;

    const result = await catalogBatchProcess(mockMixedEvent);

    expect(result.batchItemFailures).toEqual([{ itemIdentifier: "bad-msg" }]);
    expect(dynamoDbMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
  });
});

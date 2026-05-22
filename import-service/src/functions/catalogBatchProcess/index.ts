import { randomUUID } from "node:crypto";
import z from "zod";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { BookDB, BookInStockDB } from "common/interfaces/book";
import { dynamoDBClient, Table } from "common/dynamoDbClient";
import { CreateProductSchema } from "common/schemas/create-product.schema";

const snsClient = new SNSClient();

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log("Canalog batch process", event);
  const batchItemFailures: { itemIdentifier: string }[] = [];

  const processItem = async (record: SQSRecord) => {
    const data = JSON.parse(record.body);

    const validation = CreateProductSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(
        `Invalid product: ${JSON.stringify(z.treeifyError(validation.error).properties)}`,
      );
    }

    const { title, price, description, count } = validation.data;

    const id = randomUUID();
    const book: BookDB = { id, title, price, description };
    const bookInStock: BookInStockDB = { product_id: id, count: count || 0 };

    await dynamoDBClient.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: Table.Products, Item: book } },
          { Put: { TableName: Table.Stocks, Item: bookInStock } },
        ],
      }),
    );

    return { product: book, stock: bookInStock };
  };

  let successfullyCreatedProducts: { product: BookDB; stock: BookInStockDB }[] =
    [];

  const results = await Promise.allSettled(
    event.Records.map((r) => processItem(r)),
  );

  if (!results.some((r) => r.status !== "rejected")) {
    console.log("All records processed");
  } else {
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        successfullyCreatedProducts.push(r.value);
      } else {
        console.log(r.reason);
        batchItemFailures.push({ itemIdentifier: event.Records[i].messageId });
      }
    });
  }

  if (successfullyCreatedProducts.length) {
    try {
      const productLines = successfullyCreatedProducts.map(
        (item) =>
          `- Title: "${item.product.title}" | Price: $${item.product.price} | Qty: ${item.stock.count}`,
      );

      const summaryMessage =
        `New products just created.\n\n` +
        `Processed successfully: ${successfullyCreatedProducts.length}/${event.Records.length} items\n\n` +
        `Products List:\n${productLines.join("\n")}`;

      const snsCommand = new PublishCommand({
        TopicArn: process.env.TOPIC_ARN,
        Subject: `Alert: Batch of ${successfullyCreatedProducts.length} products created`,
        Message: summaryMessage,
      });
      await snsClient.send(snsCommand);
    } catch (snsError) {
      console.error("Failed to send SNS alert:", snsError);
    }
  }

  return { batchItemFailures };
};

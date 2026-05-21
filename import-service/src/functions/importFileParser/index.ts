import { S3Event, S3EventRecord } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import csvParser from "csv-parser";
import z from "zod";

const s3Client = new S3Client();
const CreateProductSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.coerce.number().int().positive(),
  count: z.coerce.number().int().nonnegative().default(0),
});

export const importFileParser = async (event: S3Event) => {
  console.log("Import file parser", event);

  const processResource = async (record: S3EventRecord) => {
    const bucket = record.s3.bucket.name;
    const file = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    let lines = 0;
    try {
      console.log(`Starting stream for: ${file}`);
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: file,
        }),
      );

      if (!s3Response.Body) {
        throw new Error("Invalid s3 object body");
      }

      const s3Stream = Readable.from(s3Response.Body as Readable);
      const csvStream = s3Stream.pipe(csvParser());

      for await (const row of csvStream) {
        const validation = CreateProductSchema.safeParse(row);
        if (!validation.success) {
          throw new Error(
            `Invalid product: ${JSON.stringify(z.treeifyError(validation.error).properties)}`,
          );
        }
        // Currently just log that item - will be processed by next task
        lines++;
        console.log(`Line #${lines}:`, JSON.stringify(validation.data));
      }

      console.log(`Processed file: ${file} - ${lines} lines processed`);
      const fileName = file.split("/").pop();
      const destinationKey = `${process.env.PARSED_FOLDER}/${fileName}`;

      console.log(`Moving ${file} to ${destinationKey}...`);
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: destinationKey,
          CopySource: `${bucket}/${encodeURIComponent(file)}`,
        }),
      );

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: file,
        }),
      );

      console.log(`Successfully moved file to: ${destinationKey}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { file, lines, error: err };
    }
    return { file, lines };
  };

  const results = await Promise.allSettled(
    event.Records.map((r) => processResource(r)),
  );

  if (!results.some((r) => r.status !== "rejected" && !!r.value.error)) {
    console.log("All records processed");
  } else {
    results.forEach((r) => {
      if (r.status !== "fulfilled") {
        console.log("Unexpected error", r.reason);
        return;
      }

      if (r.value.error) {
        const err = r.value.error as Error;
        console.log(
          `Failed to process file: ${r.value.file}, ${r.value.lines} processed`,
          err.message,
        );
        console.error(err.stack);
      }
    });
  }
};

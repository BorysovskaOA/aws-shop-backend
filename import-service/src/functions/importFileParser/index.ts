import { S3Event, S3EventRecord } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { withCatchError } from "../../utils/withCatchError";
import { Readable } from "node:stream";
import csvParser from "csv-parser";

const s3Client = new S3Client();
const PARSED_FOLDER = process.env.PARSED_FOLDER;

export const importFileParser = withCatchError(async (event: S3Event) => {
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
        // Currently just log that item - will be processed by next task
        lines++;
        console.log(`Line #${lines}:`, JSON.stringify(row));
      }

      console.log(`Processed file: ${file} - ${lines} lines processed`);
    } catch (error) {
      console.log(
        `Failed to process file: ${file} - ${lines} lines already processed`,
      );
      throw error;
    }

    const fileName = file.split("/").pop();
    const destinationKey = `${PARSED_FOLDER}/${fileName}`;

    console.log(`Moving ${file} to ${destinationKey}...`);

    try {
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
      console.log(`Failed to move file ${file}`, error);
    }
  };

  await Promise.allSettled(event.Records.map((r) => processResource(r)));
});

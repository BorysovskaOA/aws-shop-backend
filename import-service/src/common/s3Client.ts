import { S3Client } from "@aws-sdk/client-s3";

export const Bucket = {
  name: process.env.BUCKET_NAME,
  folders: {
    uploaded: "uploaded",
    parsed: "parsed",
  },
};

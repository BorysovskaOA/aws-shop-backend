import { APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { withCatchError } from "common/utils/withCatchError";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "common/utils/formatResponse";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client();
const IMPORTED_FILE_EXTENTION = ".csv";
const IMPORTED_FILE_CONTENT_TYPE = "text/csv";
const SIGNED_URL_EXPIRES_IN_MS = 1000;

export const importProductsFile = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    console.log("Import products file", JSON.stringify(event));

    const fileName = event.queryStringParameters?.name;
    if (!fileName || !fileName.endsWith(IMPORTED_FILE_EXTENTION)) {
      return formatErrorResponse(`Invalid file name ${fileName}`, 400);
    }

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `${process.env.UPLOADED_FOLDER}/${fileName}`,
      ContentType: IMPORTED_FILE_CONTENT_TYPE,
    });

    console.log(process.env.BUCKET_NAME, process.env.UPLOADED_FOLDER);

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_EXPIRES_IN_MS,
    });

    return formatSuccessResponse({ url });
  },
);

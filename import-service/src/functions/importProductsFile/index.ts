import { APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { withCatchError } from "../../utils/withCatchError";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../../utils/formatResponse";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({});
const IMPORTED_FILE_EXTENTION = ".csv";
const IMPORTED_FILE_CONTENT_TYPE = "text/csv";
const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOADED_FOLDER = process.env.UPLOADED_FOLDER;
const SIGNED_URL_EXPIRES_IN_MS = 1000;

export const importProductsFile = withCatchError(
  async (event: APIGatewayProxyEvent) => {
    console.log("Import products file", event);

    const fileName = event.queryStringParameters?.name;
    if (!fileName || !fileName.endsWith(IMPORTED_FILE_EXTENTION)) {
      return formatErrorResponse(`Invalid file name ${fileName}`, 400);
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${UPLOADED_FOLDER}/${fileName}`,
      ContentType: IMPORTED_FILE_CONTENT_TYPE,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_EXPIRES_IN_MS,
    });

    return formatSuccessResponse({ url });
  },
);

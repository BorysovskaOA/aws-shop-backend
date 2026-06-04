import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Basic authorizer", JSON.stringify(event));

  const authorizationHeader = event.authorizationToken;

  if (!authorizationHeader) {
    throw new Error("Unauthorized");
  }
  let username: string = "";
  const resourceArn = event.methodArn;

  try {
    const [authType, encodedCreds] = authorizationHeader.split(" ");

    if (authType.toLowerCase() !== "basic" || !encodedCreds) {
      throw new Error("Access Denied");
    }

    const decodedCreds = Buffer.from(encodedCreds, "base64").toString("utf-8");
    const creds = decodedCreds.split(":");

    username = creds[0];
    const password = creds[1];

    const expectedPassword = process.env[username];

    if (expectedPassword && expectedPassword === password) {
      return generatePolicy(username, "Allow", resourceArn);
    } else {
      return generatePolicy(username, "Deny", resourceArn);
    }
  } catch (error) {
    console.error("Authorization error:", error);
    return generatePolicy(username || "unknown_user", "Deny", resourceArn);
  }
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};

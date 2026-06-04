import "source-map-support/register";
import * as cdk from "aws-cdk-lib/core";
import { AuthorizationServiceStack } from "../lib/main.stack";

const app = new cdk.App();

new AuthorizationServiceStack(app, "AuthorizationServiceStack");

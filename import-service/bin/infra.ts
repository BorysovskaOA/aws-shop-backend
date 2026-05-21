import "source-map-support/register";
import * as cdk from "aws-cdk-lib/core";
import { ImportServiceStack } from "../lib/main.stack";

const app = new cdk.App();

new ImportServiceStack(app, "ImportServiceStack");

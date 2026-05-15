import "source-map-support/register";
import * as cdk from "aws-cdk-lib/core";
import { ProductServiceStack } from "../lib/main.stack";

const app = new cdk.App();

new ProductServiceStack(app, "ProductServiceStack");

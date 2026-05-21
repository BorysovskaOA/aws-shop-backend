import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

interface ApiGatewayResourcesProps {
  importProductsFile: lambda.IFunction;
}

export class ApiGatewayResources extends Construct {
  public readonly httpApi: apigw.HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayResourcesProps) {
    super(scope, id);

    this.httpApi = new apigw.HttpApi(this, "ImportsApi", {
      apiName: "Import Service",
      createDefaultStage: false,
      corsPreflight: {
        allowMethods: [apigw.CorsHttpMethod.GET],
        allowOrigins: [
          "http://localhost:3000",
          "https://d180fy39z34bng.cloudfront.net",
        ],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    new apigw.HttpStage(this, "DefaultStage", {
      httpApi: this.httpApi,
      stageName: "$default",
      autoDeploy: true,
      throttle: { rateLimit: 10, burstLimit: 20 },
    });

    this.httpApi.addRoutes({
      path: "/import",
      methods: [apigw.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ImportProductFileIntegration",
        props.importProductsFile,
      ),
    });
  }
}

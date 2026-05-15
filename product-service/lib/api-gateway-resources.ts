import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

interface ApiGatewayResourcesProps {
  getProductsList: lambda.IFunction;
  getProductById: lambda.IFunction;
  createProduct: lambda.IFunction;
}

export class ApiGatewayResources extends Construct {
  public readonly httpApi: apigw.HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayResourcesProps) {
    super(scope, id);

    this.httpApi = new apigw.HttpApi(this, "ProductsApi", {
      apiName: "Product Service",
      createDefaultStage: false,
      corsPreflight: {
        allowMethods: [apigw.CorsHttpMethod.GET],
        allowOrigins: ["http://localhost:3000", "https://cloudfront.net"],
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
      path: "/products",
      methods: [apigw.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        props.getProductsList,
      ),
    });

    this.httpApi.addRoutes({
      path: "/products",
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateProductIntegration",
        props.createProduct,
      ),
    });

    this.httpApi.addRoutes({
      path: "/products/{productId}",
      methods: [apigw.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetProductByIdIntegration",
        props.getProductById,
      ),
    });
  }
}

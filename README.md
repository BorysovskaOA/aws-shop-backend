# React-shop-backend

This is backend monorepo project for nodejs-aws mentoring program.

# Project links:

Project is deployed on: https://d180fy39z34bng.cloudfront.net

## Available Top-level Scripts

### `test`

Runs tests in all workspaces if test command is defined

### `deploy`

Deploys the infrastructure resources to your AWS account based on the defined stacks.

### `bootstrap`

Prepares your AWS account for CDK. Creates the necessary resources to store assets during deployment.

### `diff`

Compares the specified stack and its dependencies with the deployed stack. Use this to visualize infrastructure changes before applying them.

### `synth`

Generates the CloudFormation template and allows you to inspect the final infrastructure definition before it is actually deployed to your account.

### `destroy`

Removes all AWS resources associated with the stacks to ensure no infrastructure is left behind.

## Available product-service scripts:

### `test:watch`

Runs tests for all functions.

### `seed`

Populates tests products to dynamo db.

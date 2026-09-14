import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { config } from "../config";

async function main() {
  const client = new DynamoDBClient({
    region: config.awsRegion,
    ...(config.dynamoEndpoint
      ? {
          endpoint: config.dynamoEndpoint,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
          },
        }
      : {}),
  });

  try {
    await client.send(new DescribeTableCommand({ TableName: config.tableName }));
    console.log(`Table ${config.tableName} already exists`);
    return;
  } catch {
    // create
  }

  try {
    await client.send(
      new CreateTableCommand({
        TableName: config.tableName,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          { AttributeName: "pk", AttributeType: "S" },
          { AttributeName: "sk", AttributeType: "S" },
          { AttributeName: "gsi1pk", AttributeType: "S" },
          { AttributeName: "gsi1sk", AttributeType: "S" },
          { AttributeName: "gsi2pk", AttributeType: "S" },
          { AttributeName: "gsi2sk", AttributeType: "S" },
          { AttributeName: "gsi3pk", AttributeType: "S" },
          { AttributeName: "gsi3sk", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "pk", KeyType: "HASH" },
          { AttributeName: "sk", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1",
            KeySchema: [
              { AttributeName: "gsi1pk", KeyType: "HASH" },
              { AttributeName: "gsi1sk", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "GSI2",
            KeySchema: [
              { AttributeName: "gsi2pk", KeyType: "HASH" },
              { AttributeName: "gsi2sk", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "GSI3",
            KeySchema: [
              { AttributeName: "gsi3pk", KeyType: "HASH" },
              { AttributeName: "gsi3sk", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      })
    );
    console.log(`Created table ${config.tableName}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`Table ${config.tableName} already exists`);
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

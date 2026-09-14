import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "coadjust-dev-secret-change-me",
  awsRegion: process.env.AWS_REGION ?? "eu-west-1",
  dynamoEndpoint: process.env.DYNAMODB_ENDPOINT,
  tableName: process.env.DYNAMODB_TABLE ?? "Coadjust",
};

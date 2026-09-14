import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE } from "./client";

export async function putItem(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function getItem(pk: string, sk: string) {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { pk, sk } })
  );
  return res.Item as Record<string, unknown> | undefined;
}

export async function queryPk(pk: string, skPrefix?: string) {
  const input: QueryCommandInput = {
    TableName: TABLE,
    KeyConditionExpression: skPrefix
      ? "pk = :pk AND begins_with(sk, :sk)"
      : "pk = :pk",
    ExpressionAttributeValues: skPrefix
      ? { ":pk": pk, ":sk": skPrefix }
      : { ":pk": pk },
  };
  const res = await docClient.send(new QueryCommand(input));
  return (res.Items ?? []) as Record<string, unknown>[];
}

export async function queryGsi(
  indexName: "GSI1" | "GSI2" | "GSI3",
  pkName: string,
  pkValue: string,
  opts?: {
    skName?: string;
    skBeginsWith?: string;
    limit?: number;
    exclusiveStartKey?: Record<string, unknown>;
    filterExpression?: string;
    expressionAttributeValues?: Record<string, unknown>;
  }
) {
  const values: Record<string, unknown> = {
    ":pk": pkValue,
    ...(opts?.expressionAttributeValues ?? {}),
  };
  let keyCond = `${pkName} = :pk`;
  if (opts?.skBeginsWith && opts.skName) {
    keyCond += ` AND begins_with(${opts.skName}, :sk)`;
    values[":sk"] = opts.skBeginsWith;
  }

  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: indexName,
      KeyConditionExpression: keyCond,
      ExpressionAttributeValues: values,
      FilterExpression: opts?.filterExpression,
      Limit: opts?.limit,
      ExclusiveStartKey: opts?.exclusiveStartKey,
    })
  );
  return {
    items: (res.Items ?? []) as Record<string, unknown>[],
    lastKey: res.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, unknown>
) {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const parts: string[] = [];
  let i = 0;
  for (const [k, v] of Object.entries(updates)) {
    const nk = `#n${i}`;
    const vk = `:v${i}`;
    names[nk] = k;
    values[vk] = v;
    parts.push(`${nk} = ${vk}`);
    i += 1;
  }
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { pk, sk },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

export async function deleteItem(pk: string, sk: string) {
  await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { pk, sk } }));
}

export async function scanEntity(entityType: string, limit = 200) {
  const res = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "entityType = :e",
      ExpressionAttributeValues: { ":e": entityType },
      Limit: limit,
    })
  );
  return (res.Items ?? []) as Record<string, unknown>[];
}

export function encodeCursor(key?: Record<string, unknown>) {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key)).toString("base64url");
}

export function decodeCursor(cursor?: string) {
  if (!cursor) return undefined;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return undefined;
  }
}

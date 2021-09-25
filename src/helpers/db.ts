import { sendData } from "./bridge";

export type DBNumber = {
  high: number;
  low: number;
}
export type NodeResult<T> = {
  identity: DBNumber,
  labels: string[],
  properties: T
};
export type QueryResult<T> = {
  records: {
    keys: string[],
    _fields: T[]
  }[],
  summary: {
    query: {
      parameters: any;
      text: string;
    },
    queryType: string;
    resultAvailableAfter: DBNumber;
    resultConsumedAfter: DBNumber;
    updateStatistics: {
      _stats: {
        constraintsAdded: 0;
        constraintsRemoved: 0;
        indexesAdded: 0;
        indexesRemoved: 0;
        labelsAdded: 0;
        labelsRemoved: 0;
        nodesCreated: 0;
        nodesDeleted: 0;
        propertiesSet: 0;
        relationshipsCreated: 0;
        relationshipsDeleted: 0;
      }
    }
  }
}

export function openConnection(id: string) {
  sendData("openConnection", { id });
}
export function closeConnection(id: string) {
  sendData("closeConnection", { id });
}
export function executeQuery<T>(id: string, query: string, params?: any) {
  console.log("Executing query", query, "with parameters", params);
  return sendData<QueryResult<T>>("executeQuery", {
    id: id,
    query,
    params
  });
}

export function isDbNumber(data) {
  return (
    typeof data?.low === "number" &&
    typeof data?.high === "number" &&
    Object.keys(data).length === 2
  );
}
const BIGINT_SEPARATOR = BigInt(Math.pow(2, 32));
export function dbNumberToString(data) {
  return (BigInt(data.high) * BIGINT_SEPARATOR + BigInt(data.low)).toString();
}
export function stringToDbNumber(str) {
  const nb = BigInt(str);
  return {
    low: Number(nb % BIGINT_SEPARATOR),
    high: Number(nb / BIGINT_SEPARATOR),
  };
}
export function nodeDataToString(data) {
  if (isDbNumber(data)) return dbNumberToString(data);
  if (data == null) return "";
  return JSON.stringify(data);
}
export function nodeDataToValue(data) {
  if (isDbNumber(data)) return dbNumberToString(data);
  if (data == null) return "NULL";
  if (typeof data === "string") return data;
  return JSON.stringify(data);
}
export function nodeDataToCypherValue(data) {
  if (isDbNumber(data)) return dbNumberToString(data);
  if (data == null) return "NULL";
  return JSON.stringify(data).replace(/"(\w+)":/g, "$1:");
}
export function stringToNodeData(str) {
  if (str === "") return null;
  if (str === "NULL") return null;
  if (str.match(/^[+-]?\d+$/g)) return stringToDbNumber(str);
  return JSON.parse(str);
}
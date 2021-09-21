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
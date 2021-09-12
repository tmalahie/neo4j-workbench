import { sendData } from "./bridge";

export type DBNumber = {
  high: number;
  low: number;
}

export type QueryResult = {
  records: {
    keys: string[],
    _fields: any[]
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
export function executeQuery(id: string, query: string, parameters?: any) {
  return sendData<QueryResult>("executeQuery", {
    id: id,
    query,
    parameters
  });
}
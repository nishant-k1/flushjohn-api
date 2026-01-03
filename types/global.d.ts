import { Server as SocketIOServer } from "socket.io";
import { Namespace } from "socket.io";

declare global {
  var io: SocketIOServer;
  var leadsNamespace: Namespace;
  var salesOrdersNamespace: Namespace;
  var speechRecognitionNamespace: Namespace;
}

export {};

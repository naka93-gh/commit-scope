import { Electroview } from "electrobun/view";
import type { CommitScopeRPC } from "../shared/types";
import { RPC_MAX_REQUEST_TIME } from "../shared/config";

const rpcInstance = Electroview.defineRPC<CommitScopeRPC>({
  maxRequestTime: RPC_MAX_REQUEST_TIME,
  handlers: {
    requests: {},
    messages: {},
  },
});

export const electrobun = new Electroview({ rpc: rpcInstance });

export const rpc = rpcInstance;

import { Electroview } from "electrobun/view";
import type { CommitScopeRPC } from "../shared/types";

const rpcInstance = Electroview.defineRPC<CommitScopeRPC>({
  handlers: {
    requests: {},
    messages: {},
  },
});

export const electrobun = new Electroview({ rpc: rpcInstance });

export const rpc = rpcInstance;

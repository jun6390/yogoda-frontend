import type { Socket } from "socket.io-client";

type Connection = Pick<
  Socket,
  "connected" | "active" | "connect" | "once" | "off" | "emit"
>;

// Only one unsent turn may wait for reconnect. Cancel it on stop, failure or timeout.
export function createQueuedChatSender(socket: Connection) {
  let pending: (() => void) | null = null;
  const cancel = () => {
    if (pending) socket.off("connect", pending);
    pending = null;
  };
  const send = (payload: Record<string, unknown>) => {
    cancel();
    if (socket.connected) {
      socket.emit("message", payload);
      return;
    }
    pending = () => {
      pending = null;
      socket.emit("message", payload);
    };
    socket.once("connect", pending);
    if (!socket.active) socket.connect();
  };
  return { send, cancel };
}

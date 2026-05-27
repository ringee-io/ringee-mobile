import { useEffect } from 'react';

type Listener = () => void;

const channels = new Map<string, Set<Listener>>();

export function emitRefresh(channel: string) {
  channels.get(channel)?.forEach((listener) => listener());
}

export function useRefreshSignal(channel: string, onRefresh: Listener) {
  useEffect(() => {
    let set = channels.get(channel);
    if (!set) {
      set = new Set();
      channels.set(channel, set);
    }
    set.add(onRefresh);
    return () => {
      set!.delete(onRefresh);
    };
  }, [channel, onRefresh]);
}

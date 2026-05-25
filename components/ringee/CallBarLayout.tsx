import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Ctx = {
  topReserve: number;
  setTopReserve: (value: number) => void;
};

const CallBarLayoutContext = createContext<Ctx>({
  topReserve: 0,
  setTopReserve: () => {},
});

export function CallBarLayoutProvider({ children }: { children: ReactNode }) {
  const [topReserve, setTopReserve] = useState(0);
  const value = useMemo(() => ({ topReserve, setTopReserve }), [topReserve]);
  return (
    <CallBarLayoutContext.Provider value={value}>
      {children}
    </CallBarLayoutContext.Provider>
  );
}

export const useCallBarLayout = () => useContext(CallBarLayoutContext);

// Inflates safe-area-top for descendants by the space the docked-top
// MiniCallBar is occupying. React Navigation reads safe-area-top to position
// the status-bar region of its native header, so widening that inset pushes
// the large title down below the floating bar instead of letting them stack.
export function CallBarTopInset({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { topReserve } = useCallBarLayout();
  return (
    <SafeAreaInsetsContext.Provider
      value={{ ...insets, top: insets.top + topReserve }}
    >
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

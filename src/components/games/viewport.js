import { createContext, useContext } from 'react';

// Size of the area a game gets inside the arcade sheet (measured by GameHub). `wide` = clearly landscape
// (landscape phones, desktop dialog): board games put their controls beside the board instead of below it.
// `short` = landscape-phone height, where even list-style games must split into two columns.
export const GameViewportContext = createContext({ width: 0, height: 0, wide: false, short: false });

export function useGameViewport() {
  return useContext(GameViewportContext);
}

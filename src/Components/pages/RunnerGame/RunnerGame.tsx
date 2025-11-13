import React, { useState } from "react";
import GameMenu from "./GameMenu";
import GameCanvas from "./GameCanvas";
import type { CharacterKey, MapKey } from "./config";

type UserType = { uid: string; email?: string | null; name?: string | null } | null;

type Props = {
  onGameOver?: (score: number) => void;
  onRoundEnd?: (data: { score: number; coins: number }) => void | Promise<void>;
  user?: any; 
};

export default function RunnerGameEntry({ onGameOver, onRoundEnd, user }: Props): JSX.Element {
  const [started, setStarted] = useState(false);
  const [selectedChar, setSelectedChar] = useState<CharacterKey>("adventurer");
  const [selectedMap, setSelectedMap] = useState<MapKey>("default");

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {!started ? (
        <GameMenu
          selectedChar={selectedChar}
          selectedMap={selectedMap}
          onChangeChar={(c) => setSelectedChar(c)}
          onChangeMap={(m) => setSelectedMap(m)}
          onStart={() => setStarted(true)}
        />
      ) : (
        <GameCanvas
          selectedChar={selectedChar}
          selectedMap={selectedMap}
          onExit={() => setStarted(false)}
          // keep legacy onGameOver handler (single score)
          onGameOver={(score: number) => {
            try {
              if (onGameOver) onGameOver(score);
              if (onRoundEnd) {
                onRoundEnd({ score, coins: 0 });
              }
            } finally {
              setStarted(false);
            }
          }}
          // forward the new richer callback so GameCanvas can call it directly with coins
          onRoundEnd={onRoundEnd}
          user={user}
        />
      )}
    </div>
  );
}

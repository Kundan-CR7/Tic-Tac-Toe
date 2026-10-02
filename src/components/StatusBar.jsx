import { COMPUTER } from "../state/store";
import { BotIcon, HandshakeIcon, TrophyIcon } from "./icons";
import { Mark } from "./Mark";
import { possessive, subjectVerb } from "../lib/text";
import "./status.css";

function describe(game, names, cpu, thinking) {
  if (game.status === "won") {
    const computerWon = cpu && game.winner === COMPUTER;
    return {
      tone: computerWon ? "lost" : "won",
      icon: computerWon ? <BotIcon /> : <TrophyIcon />,
      text: `${subjectVerb(names[game.winner], "win", "wins")}${computerWon ? "" : "!"}`,
    };
  }
  if (game.status === "draw") {
    return {
      tone: "draw",
      icon: <HandshakeIcon />,
      text: game.drawReason === "repetition" ? "Draw by repetition" : "It’s a draw",
    };
  }
  if (thinking) {
    return { tone: "thinking", icon: <Mark player={COMPUTER} />, text: "Computer is thinking" };
  }
  const name = names[game.turn];
  return {
    tone: "turn",
    icon: <Mark player={game.turn} />,
    text: name === "You" ? "Your turn" : `${possessive(name)} turn`,
  };
}

export function StatusBar({ game, names, cpu, thinking }) {
  const { tone, icon, text } = describe(game, names, cpu, thinking);
  const player = game.status === "won" ? game.winner : game.status === "playing" ? game.turn : undefined;
  const fading = game.status === "playing" && game.vanishingCell !== null;

  return (
    <div className="status" data-tone={tone} data-player={player}>
      <p className="status-pill" key={`${tone}-${player}`}>
        <span className="status-icon">{icon}</span>
        <span className="status-text">{text}</span>
        {thinking && (
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </p>
      {game.rules === "vanishing" && (
        <p className="status-detail" data-visible={fading || undefined}>
          {fading ? "The faded mark disappears with the next move." : "\u00a0"}
        </p>
      )}
    </div>
  );
}

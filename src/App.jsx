import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { playSound } from "./audio/sound";
import { Board } from "./components/Board";
import { Controls } from "./components/Controls";
import { Dialog } from "./components/Dialog";
import { GameSettings } from "./components/GameSettings";
import { Header } from "./components/Header";
import { HistoryPanel } from "./components/HistoryPanel";
import { LiveRegion } from "./components/LiveRegion";
import { ModeBar } from "./components/ModeBar";
import { Scoreboard } from "./components/Scoreboard";
import { SettingsDialog } from "./components/SettingsDialog";
import { StatusBar } from "./components/StatusBar";
import { celebrate } from "./effects/confetti";
import { cellName, deriveGame, lineName } from "./game/rules";
import { useAnnouncer } from "./hooks/useAnnouncer";
import { useComputerOpponent } from "./hooks/useComputerOpponent";
import { useGameStore } from "./hooks/useGameStore";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { usePreferences } from "./hooks/usePreferences";
import { useSound } from "./hooks/useSound";
import { capitalize, possessive, subjectVerb } from "./lib/text";
import { COMPUTER, canUndo, currentStreak, displayName, scoresFor } from "./state/store";

const CLEAR_MS = 320;
const RESULT_SOUND_DELAY_MS = 300;
const CELEBRATE_DELAY_MS = 520;
const FOCUS_RESULT_DELAY_MS = 750;

function confettiColors(winner) {
  const style = getComputedStyle(document.documentElement);
  const own = winner === "X" ? ["--x", "--x-strong"] : ["--o", "--o-strong"];
  const other = winner === "X" ? "--o" : "--x";
  return [...own, ...own, "--gold", "--gold", other]
    .map((name) => style.getPropertyValue(name).trim())
    .filter(Boolean);
}

function turnSentence(game, names, cpu) {
  if (cpu && game.turn === COMPUTER) return "Computer is thinking.";
  return `${possessive(names[game.turn])} turn.`;
}

function moveSentence(game, names, cpu) {
  const name = names[game.board[game.lastMove]];
  const parts = [`${name} played ${cellName(game.lastMove)}.`];
  if (game.lastRemoved !== null) {
    parts.push(`${possessive(name)} mark on ${cellName(game.lastRemoved)} vanished.`);
  }
  if (game.status === "won") {
    const how = game.lines.length > 1 ? "two lines" : `the ${lineName(game.lines[0])}`;
    parts.push(`${subjectVerb(names[game.winner], "win", "wins")} with ${how}!`);
  } else if (game.status === "draw") {
    parts.push(game.drawReason === "repetition" ? "Draw by repetition." : "It’s a draw.");
  } else {
    parts.push(turnSentence(game, names, cpu));
  }
  return parts.join(" ");
}

const isTyping = (target) =>
  target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select")));

export default function App() {
  const [state, dispatch] = useGameStore();
  const { settings, round, history } = state;
  const { prefs, update: updatePrefs, theme, reducedMotion } = usePreferences();
  const wide = useMediaQuery("(min-width: 1180px)");
  const sound = useSound(prefs.sound);
  const [message, announce] = useAnnouncer();
  const [clearing, setClearing] = useState(false);
  const [dialog, setDialog] = useState(null);
  const boardRef = useRef(null);
  const restartRef = useRef(null);
  const clearTimer = useRef(0);
  const timers = useRef(new Set());
  const setupTitleId = useId();
  const historyTitleId = useId();

  const game = useMemo(
    () => deriveGame(round.moves, { starter: round.starter, rules: settings.rules }),
    [round, settings.rules],
  );
  const names = useMemo(() => ({ X: displayName(settings, "X"), O: displayName(settings, "O") }), [settings]);
  const scores = scoresFor(state);
  const streak = currentStreak(state);
  const cpu = settings.mode === "cpu";
  const thinking = useComputerOpponent({ state, game, paused: clearing, dispatch });
  const interactive = game.status === "playing" && !clearing && !(cpu && game.turn === COMPUTER);
  const hasScores = Object.values(state.scores).some((score) => score.X + score.O + score.draw > 0);

  const later = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      callback();
    }, delay);
    timers.current.add(id);
  }, []);

  const cancelLater = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  useEffect(
    () => () => {
      cancelLater();
      clearTimeout(clearTimer.current);
    },
    [cancelLater],
  );

  // Sound, announcements, confetti and focus, driven by what changed since the last render.
  const seen = useRef({ roundId: round.id, moveCount: game.moveCount });
  useEffect(() => {
    const previous = seen.current;
    seen.current = { roundId: round.id, moveCount: game.moveCount };

    if (previous.roundId !== round.id) {
      cancelLater();
      announce(`New round. ${subjectVerb(names[game.starter], "go", "goes")} first.`);
      sound("start");
      return;
    }
    if (game.moveCount < previous.moveCount) {
      announce(`Move undone. ${turnSentence(game, names, cpu)}`);
      sound("undo");
      return;
    }
    if (game.moveCount === previous.moveCount) return;

    announce(moveSentence(game, names, cpu));
    sound(`place-${game.board[game.lastMove]}`);
    if (game.status === "playing") return;

    if (game.status === "won") {
      const lost = cpu && game.winner === COMPUTER;
      later(() => sound(lost ? "lose" : "win"), RESULT_SOUND_DELAY_MS);
      if (!lost && !reducedMotion) {
        later(() => {
          const element = boardRef.current?.element();
          if (element) celebrate(element, confettiColors(game.winner));
        }, CELEBRATE_DELAY_MS);
      }
    } else {
      later(() => sound("draw"), RESULT_SOUND_DELAY_MS);
    }
    later(() => {
      if (boardRef.current?.contains(document.activeElement)) restartRef.current?.focus();
    }, FOCUS_RESULT_DELAY_MS);
  }, [round.id, game, names, cpu, reducedMotion, announce, sound, later, cancelLater]);

  const playCell = useCallback(
    (cell) => dispatch({ type: "move", cell, player: game.turn, at: Date.now() }),
    [dispatch, game.turn],
  );

  const onBlocked = useCallback(
    (cell) => {
      if (game.status !== "playing") {
        announce("This game is over. Choose Play again for a new round.");
      } else if (cpu && game.turn === COMPUTER) {
        announce("Wait for the computer’s move.");
      } else if (game.board[cell]) {
        sound("blocked");
        announce(`${capitalize(cellName(cell))} is taken.`);
      }
    },
    [game, cpu, announce, sound],
  );

  const restart = useCallback(() => {
    if (clearing) return;
    const from = round.id;
    const refocus = game.status !== "playing" && document.activeElement === restartRef.current;
    const finish = () => {
      setClearing(false);
      dispatch({ type: "newRound", from });
      if (refocus) requestAnimationFrame(() => boardRef.current?.focus());
    };
    cancelLater();
    if (reducedMotion || game.moveCount === 0) {
      finish();
      return;
    }
    setClearing(true);
    clearTimer.current = setTimeout(finish, CLEAR_MS);
  }, [clearing, round.id, game, reducedMotion, dispatch, cancelLater]);

  const undo = useCallback(() => {
    if (!clearing) dispatch({ type: "undo" });
  }, [clearing, dispatch]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== "z" || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) {
        return;
      }
      if (dialog || isTyping(event.target)) return;
      event.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog, undo]);

  const changeSettings = useCallback((patch) => dispatch({ type: "updateSettings", patch }), [dispatch]);

  const rename = useCallback(
    (player, name) => dispatch({ type: "updateSettings", patch: { names: { [player]: name } } }),
    [dispatch],
  );

  const toggleTheme = (event) => {
    const apply = () => updatePrefs({ theme: theme === "dark" ? "light" : "dark" });
    if (reducedMotion || typeof document.startViewTransition !== "function") {
      apply();
      return;
    }
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(() => flushSync(apply));
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
  };

  const toggleSound = () => {
    const next = !prefs.sound;
    updatePrefs({ sound: next });
    if (next) playSound("toggle");
  };

  const closeDialog = useCallback(() => setDialog(null), []);

  const tone =
    game.status === "won" ? `win-${game.winner}` : game.status === "draw" ? "draw" : game.turn;

  return (
    <div className="app" data-tone={tone}>
      <a
        className="skip-link"
        href="#board"
        onClick={(event) => {
          event.preventDefault();
          boardRef.current?.focus();
        }}
      >
        Skip to the game board
      </a>

      <Header
        theme={theme}
        sound={prefs.sound}
        showHistory={!wide}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onOpenHistory={() => setDialog("history")}
        onOpenSettings={() => setDialog("settings")}
      />

      <main className="layout">
        {wide && (
          <section className="side side-left" aria-labelledby={setupTitleId}>
            <div className="panel">
              <div className="panel-head">
                <h2 className="panel-title" id={setupTitleId}>
                  Game setup
                </h2>
                <p className="panel-note">Changes start a new round.</p>
              </div>
              <GameSettings settings={settings} onChange={changeSettings} />
            </div>
          </section>
        )}

        <div className="play">
          {!wide && <ModeBar settings={settings} onChange={changeSettings} />}
          <Scoreboard
            settings={settings}
            names={names}
            scores={scores}
            game={game}
            thinking={thinking}
            streak={streak}
            onRename={rename}
          />
          <StatusBar game={game} names={names} cpu={cpu} thinking={thinking} />
          <div className="board-area">
            <Board
              ref={boardRef}
              game={game}
              turn={game.turn}
              interactive={interactive}
              clearing={clearing}
              roundId={round.id}
              reducedMotion={reducedMotion}
              onPlay={playCell}
              onBlocked={onBlocked}
            />
          </div>
          <Controls
            canUndo={!clearing && canUndo(state)}
            finished={game.status !== "playing"}
            restartRef={restartRef}
            onUndo={undo}
            onRestart={restart}
          />
        </div>

        {wide && (
          <section className="side side-right" aria-labelledby={historyTitleId}>
            <div className="panel">
              <HistoryPanel
                history={history}
                settings={settings}
                names={names}
                scores={scores}
                titleId={historyTitleId}
                scrollable
              />
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          <span>
            <kbd>←</kbd>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <kbd>→</kbd>
            &nbsp;Move
          </span>
          <span>
            <kbd>Enter</kbd>
            &nbsp;Place
          </span>
          <span>
            <kbd>Ctrl</kbd>/<kbd>⌘</kbd>
            <kbd>Z</kbd>
            &nbsp;Undo
          </span>
        </p>
      </footer>

      <SettingsDialog
        open={dialog === "settings"}
        onRequestClose={closeDialog}
        reducedMotion={reducedMotion}
        settings={settings}
        prefs={prefs}
        hasScores={hasScores}
        hasHistory={history.length > 0}
        onChangeSettings={changeSettings}
        onRename={rename}
        onChangePrefs={updatePrefs}
        onResetScores={() => {
          dispatch({ type: "resetScores" });
          announce("All scores reset.");
        }}
        onClearHistory={() => {
          dispatch({ type: "clearHistory" });
          announce("Match history cleared.");
        }}
      />

      <Dialog
        open={dialog === "history"}
        onRequestClose={closeDialog}
        title="Match history"
        reducedMotion={reducedMotion}
        className="history-dialog"
      >
        <HistoryPanel history={history} settings={settings} names={names} scores={scores} showTitle={false} />
      </Dialog>

      <LiveRegion message={message} />
    </div>
  );
}

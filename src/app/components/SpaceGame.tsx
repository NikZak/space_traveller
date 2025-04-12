"use client";

import { useEffect, useRef } from "react";
import { GameEngine } from "./GameEngine";

export default function SpaceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas);

    // Start the game
    gameEngineRef.current.start();

    // Cleanup
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current.cleanup();
        gameEngineRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
      }}
    />
  );
}

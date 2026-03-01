"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const loadAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, []);

  useEffect(() => {
    loadAudio();
  }, [audioUrl, loadAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const v = parseFloat(e.target.value);
    audio.currentTime = v;
    setCurrentTime(v);
  };

  const handleSpeedChange = (s: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = s;
    setSpeed(s);
  };

  return (
    <div className="min-w-0 overflow-visible rounded-xl border border-stone-200/80 bg-white/90 p-4 shadow-md shadow-stone-200/50 ring-1 ring-stone-200/50">
      <audio ref={audioRef} preload="metadata">
        <source src={audioUrl} type="audio/mpeg" />
      </audio>

      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          className="h-11 w-11 shrink-0 rounded-full border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 sm:h-12 sm:w-12"
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </Button>
        <div className="min-w-0 flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="h-2 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-stone-200 accent-teal-600"
          />
          <div className="flex justify-between text-xs text-stone-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="w-full shrink-0 text-sm font-medium text-stone-600 sm:w-auto">Speed:</span>
        <div className="flex flex-wrap gap-1 rounded-lg border border-stone-200/80 bg-stone-50/50 p-1">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              variant={speed === s ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSpeedChange(s)}
              className={`min-h-8 min-w-[2.5rem] touch-manipulation sm:min-h-0 ${speed === s ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm" : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-800"}`}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

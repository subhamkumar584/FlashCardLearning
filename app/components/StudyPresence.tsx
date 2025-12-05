"use client";

import React, { useEffect, useRef, useState } from "react";

interface StudyPresenceProps {
  userId: string;
  onSecondsTick?: () => void;
}

const StudyPresence: React.FC<StudyPresenceProps> = ({ onSecondsTick }) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [isUserPresent, setIsUserPresent] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // -------------------------------
  // Online/offline detection
  // -------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateStatus = () => setIsOnline(navigator.onLine);

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  // -------------------------------
  // Enable camera
  // -------------------------------
  const handleEnableCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not available in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      streamRef.current = stream;
      setCameraEnabled(true);
      setCameraError(null);
    } catch (err) {
      console.error("Error enabling camera", err);
      setCameraError("Unable to access camera. Check permissions and try again.");
    }
  };

  // Attach camera stream to video
  useEffect(() => {
    if (!cameraEnabled || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      void playPromise.catch((err) => {
        console.warn("Video autoplay blocked:", err);
      });
    }
  }, [cameraEnabled]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // -------------------------------
  // Presence detection (FaceDetector + brightness)
  // -------------------------------
  useEffect(() => {
    if (!cameraEnabled || !isRunning || !videoRef.current) return;

    let cancelled = false;

    type FaceDetectorConstructor =
      | (new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
          detect: (input: HTMLVideoElement) => Promise<Array<unknown>>;
        })
      | undefined;

    const DetectorCtor = (window as Window & { FaceDetector?: FaceDetectorConstructor }).FaceDetector;
    const detector = DetectorCtor ? new DetectorCtor({ fastMode: true, maxDetectedFaces: 1 }) : null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const checkPresence = async () => {
      const video = videoRef.current;
      if (!video || !ctx) return;

      try {
        let facesCount = 0;

        if (detector) {
          const faces = await detector.detect(video);
          facesCount = faces.length;
        }

        const width = 160;
        const height = 90;
        canvas.width = width;
        canvas.height = height;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const pixels = data.length / 4;

          let sum = 0;
          let sumSq = 0;

          for (let i = 0; i < data.length; i += 4) {
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += lum;
            sumSq += lum * lum;
          }

          const avg = sum / pixels;
          const variance = sumSq / pixels - avg * avg;

          const veryDark = avg < 25;
          const veryFlat = variance < 50;

          const cameraCovered = veryDark || veryFlat;

          if (!cancelled) {
            const present = cameraCovered ? false : detector ? facesCount > 0 : true;
            setIsUserPresent(present);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("Presence detection failed:", e);
          setIsUserPresent(false);
        }
      }
    };

    const id = window.setInterval(checkPresence, 4000);
    void checkPresence();

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [cameraEnabled, isRunning]);

  // -------------------------------
  // Timer Auto-Pause
  // -------------------------------
  const isAutoPaused = cameraEnabled && isUserPresent !== true;
  const isTimerActive = isRunning && !isAutoPaused;

  useEffect(() => {
    if (!isTimerActive) return;

    const id = setInterval(() => {
      setSeconds((s) => s + 1);
      if (onSecondsTick) onSecondsTick();
    }, 1000);

    return () => clearInterval(id);
  }, [isTimerActive, onSecondsTick]);

  // -------------------------------
  // Controls
  // -------------------------------
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;

  const handleToggle = async () => {
    if (!isRunning) {
      if (!cameraEnabled) await handleEnableCamera();
      setIsRunning(true);
      return;
    }

    setIsRunning(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) videoRef.current.srcObject = null;

    setCameraEnabled(false);
    setIsUserPresent(null);
  };

  const handleReset = () => setSeconds(0);

  const studyStatusLabel = isTimerActive
    ? "Studying"
    : isAutoPaused
    ? "Not studying – user not detected or camera covered"
    : "Not studying";

  // -------------------------------
  // JSX
  // -------------------------------
  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl p-4 ring-1 ring-white/20 text-slate-100 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Study timer</h2>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isOnline ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
          }`}
        >
          <span
            className={`mr-1 h-2 w-2 rounded-full ${
              isOnline ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {isOnline ? "Online" : "Offline – Firestore in offline mode"}
        </span>
      </div>

      <p className="text-sm text-slate-300">
        This timer tracks how long you have kept the dashboard open in this session.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start mt-1">
        {/* Timer */}
        <div className="space-y-3">
          <div className="text-3xl font-mono font-bold text-indigo-300">
            {minutes.toString().padStart(2, "0")}:
            {remainderSeconds.toString().padStart(2, "0")}
          </div>

          <div className="text-sm">
            <span className="font-medium">Status: </span>
            <span
              className={
                studyStatusLabel.startsWith("Studying")
                  ? "text-emerald-300"
                  : "text-amber-300"
              }
            >
              {studyStatusLabel}
            </span>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleToggle}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              {isRunning ? "Stop" : "Start"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-100"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Camera */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Camera presence</span>

            {cameraEnabled && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/60">
                {isUserPresent === null
                  ? "Detecting..."
                  : isUserPresent
                  ? "Face detected"
                  : "No face or camera covered"}
              </span>
            )}
          </div>

          <div className="relative overflow-hidden rounded-lg bg-black/60 border border-slate-600 h-32 sm:h-36">
            {cameraEnabled ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-xs text-slate-300 px-3 text-center">
                <p>Enable your camera so we can pause the timer when you leave.</p>
              </div>
            )}
          </div>

          {!cameraEnabled && (
            <button
              type="button"
              onClick={handleEnableCamera}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 w-full"
            >
              Enable camera
            </button>
          )}

          {cameraError && (
            <p className="text-[11px] text-rose-300">{cameraError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPresence;

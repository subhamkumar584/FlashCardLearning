"use client";

import React, { useEffect, useRef, useState } from "react";

interface StudyPresenceProps {
  userId: string;
  onSecondsTick?: () => void;
}

const StudyPresence: React.FC<StudyPresenceProps> = ({ onSecondsTick }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Camera / presence state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isUserPresent, setIsUserPresent] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Basic connectivity indicator so users know why Firestore might be offline.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  // Start camera on demand
  const handleEnableCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not available in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCameraEnabled(true);
      setCameraError(null);
    } catch (err) {
      console.error("Error enabling camera", err);
      setCameraError("Unable to access camera. Check permissions and try again.");
    }
  };

  // Once the video element is mounted and we have a stream, attach it.
  useEffect(() => {
    if (!cameraEnabled || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Video autoplay was blocked:", err);
      });
    }
  }, [cameraEnabled]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Use FaceDetector when available, plus a simple brightness/variance check
  // to guess when the camera is covered.
  // This runs continuously while the timer is in the "running" state.
  useEffect(() => {
    if (!cameraEnabled || !isRunning || !videoRef.current) return;
    let cancelled = false;

    const anyWindow = window as any;
    const DetectorCtor = anyWindow.FaceDetector;
    const detector = DetectorCtor ? new DetectorCtor({ fastMode: true, maxDetectedFaces: 1 }) : null;

    // Offscreen canvas for basic brightness analysis
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

        // Analyze brightness to detect "covered" camera frames
        const width = 160;
        const height = 90;
        canvas.width = width;
        canvas.height = height;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          let sum = 0;
          let sumSq = 0;
          const pixels = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = (r + g + b) / 3;
            sum += lum;
            sumSq += lum * lum;
          }

          const avg = sum / pixels;
          const variance = sumSq / pixels - avg * avg;

          const veryDark = avg < 25; // mostly black / covered
          const veryFlat = variance < 50; // almost no texture (close object / fully covered)

          const cameraCovered = veryDark || veryFlat;

          if (!cancelled) {
            let present: boolean;

            if (cameraCovered) {
              // Clearly covered or almost completely dark => not studying.
              present = false;
            } else if (detector) {
              // If we have real face detection, trust it.
              present = facesCount > 0;
            } else {
              // Fallback: camera is not covered and we don't have FaceDetector.
              // Treat this as "user present" so the timer can run.
              present = true;
            }

            setIsUserPresent(present);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("Presence detection failed; assuming not present", e);
          setIsUserPresent(false);
        }
      }
    };

    // Check every few seconds
    const intervalId = window.setInterval(checkPresence, 4000);
    // Run one immediate check once the video is ready
    void checkPresence();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [cameraEnabled, isRunning]);

  // Timer: only tick when "running" and the user is positively detected.
  // If the camera is enabled and we haven't seen a face yet (null) or
  // we lost the face (false), keep the timer paused.
  const isAutoPaused = cameraEnabled && isUserPresent !== true;
  const isTimerActive = isRunning && !isAutoPaused;

  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
      onSecondsTick?.();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, onSecondsTick]);

  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;

  const handleToggle = async () => {
    // If we are transitioning from stopped -> running, start camera + timer.
    if (!isRunning) {
      if (!cameraEnabled) {
        await handleEnableCamera();
      }
      setIsRunning(true);
      return;
    }

    // If we are transitioning from running -> stopped, stop timer + camera.
    setIsRunning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
    setIsUserPresent(null);
  };

  const handleReset = () => {
    setSeconds(0);
  };

  const studyStatusLabel = (() => {
    if (isTimerActive) return "Studying";
    if (isAutoPaused) return "Not studying – user not detected or camera covered";
    return "Not studying";
  })();

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
        {/* Timer side */}
        <div className="space-y-3">
          <div className="text-3xl font-mono font-bold text-indigo-300">
            {minutes.toString().padStart(2, "0")}:{remainderSeconds
              .toString()
              .padStart(2, "0")}
          </div>

          <div className="text-sm">
            <span className="font-medium">Status:</span>{" "}
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
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
            >
              {isRunning ? "Stop" : "Start"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Camera side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Camera presence</span>
            {cameraEnabled && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-200">
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
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 w-full transition-colors"
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

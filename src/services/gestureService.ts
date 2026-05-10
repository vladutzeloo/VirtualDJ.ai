import {
  GestureRecognizer,
  FilesetResolver,
  type GestureRecognizerResult,
} from '@mediapipe/tasks-vision';

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

let recognizerPromise: Promise<GestureRecognizer> | null = null;

const loadRecognizer = (): Promise<GestureRecognizer> => {
  if (!recognizerPromise) {
    recognizerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      return GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    })();
  }
  return recognizerPromise;
};

export interface DetectedGesture {
  category: string;
  score: number;
  handedness: string;
}

export const recognizeFromVideo = async (
  video: HTMLVideoElement,
  timestampMs: number = performance.now(),
): Promise<DetectedGesture[]> => {
  if (video.readyState < 2) return [];
  const recognizer = await loadRecognizer();
  const result: GestureRecognizerResult = recognizer.recognizeForVideo(
    video,
    timestampMs,
  );

  return result.gestures.flatMap((gestureList, handIdx) => {
    const handLabel = result.handedness[handIdx]?.[0]?.categoryName ?? 'Unknown';
    return gestureList.map((g) => ({
      category: g.categoryName,
      score: g.score,
      handedness: handLabel,
    }));
  });
};

export const disposeGestureRecognizer = async () => {
  if (recognizerPromise) {
    const r = await recognizerPromise;
    r.close();
    recognizerPromise = null;
  }
};

export const mapGestureToAction = (category: string): string | null => {
  switch (category) {
    case 'Closed_Fist':
      return 'fist';
    case 'Open_Palm':
      return 'open hand';
    case 'Pointing_Up':
      return 'pointing up';
    case 'Thumb_Up':
      return 'thumbs up';
    case 'Victory':
      return 'two fingers spread';
    case 'ILoveYou':
      return 'love sign';
    default:
      return null;
  }
};

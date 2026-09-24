import { useCallback, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createWorker } from "tesseract.js";
import {
  ArrowLeft,
  Check,
  RotateCcw,
  Upload,
  ZoomIn,
} from "lucide-react";

const categories = [
  "Food",
  "Transport",
  "Personal",
  "Medical",
  "Entertainment",
  "Education",
  "Bills",
  "Other",
];

function extractAmount(text) {
  const candidates = [];
  const identityDocument = /aadhaar|uidai|unique identification/i.test(text);
  const groupedIdentityNumber = text.match(
    /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/
  );

  if (identityDocument && groupedIdentityNumber) {
    return groupedIdentityNumber[0].replace(/[\s-]/g, "");
  }

  const contentLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const numericCrop =
    contentLines.length <= 2 &&
    contentLines.every((line) => /^[\s₹$€£,\d.]+$/.test(line));

  for (const line of contentLines) {
    const normalizedLine = line
      .replace(/[Oo]/g, "0")
      .replace(/[Il|]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/[Bb]/g, "8")
      .replace(/,/g, "");
    const hasCurrency =
      /₹|\$|€|£|\b(?:rs\.?|inr|usd|eur|gbp)\b/i.test(line);
    const hasAmountLabel =
      /grand total|total|amount payable|payable|net amount|balance due|amount due|subtotal/i.test(
        line
      );
    const numberOnlyLine = /^[\s₹$€£,\d.]+$/.test(line.trim());

    if (!hasCurrency && !hasAmountLabel && (!numberOnlyLine || !numericCrop)) {
      continue;
    }

    const matches =
      normalizedLine.match(/\d+(?:\.\d{1,2})?/g) || [];

    for (const match of matches) {
      const value = Number(match);

      if (!value || value >= 10000000 || (numberOnlyLine && value >= 1000000000)) {
        continue;
      }

      let score = numberOnlyLine && numericCrop ? 50 : 0;

      if (hasCurrency) score += 100;
      if (hasAmountLabel) score += 120;

      if (match.includes(".")) {
        score += 20;
      }

      candidates.push({ value, score });
    }
  }

  candidates.sort((first, second) => {
    if (second.score !== first.score) return second.score - first.score;
    return second.value - first.value;
  });

  return candidates[0]?.value.toFixed(2) || "";
}

export default function ReceiptScanner({ onExpenseDetected, onClose }) {
  const inputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [step, setStep] = useState("upload");
  const [crop, setCrop] = useState({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [ocrText, setOcrText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");

  const [progress, setProgress] = useState(0);

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setCrop({
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);

    setStep("crop");

    event.target.value = "";
  };

  const handleCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!image || !croppedAreaPixels) return null;

    const img = new Image();

    img.src = image;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const rotationRadians = (rotation * Math.PI) / 180;
    const rotatedWidth = Math.abs(
      Math.cos(rotationRadians) * img.width
    ) + Math.abs(Math.sin(rotationRadians) * img.height);
    const rotatedHeight = Math.abs(
      Math.sin(rotationRadians) * img.width
    ) + Math.abs(Math.cos(rotationRadians) * img.height);
    const rotatedCanvas = document.createElement("canvas");

    rotatedCanvas.width = Math.ceil(rotatedWidth);
    rotatedCanvas.height = Math.ceil(rotatedHeight);

    const rotatedContext = rotatedCanvas.getContext("2d");

    if (!rotatedContext) {
      throw new Error("Could not prepare the rotated image.");
    }

    rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
    rotatedContext.rotate(rotationRadians);
    rotatedContext.drawImage(img, -img.width / 2, -img.height / 2);

    const { width, height, x, y } = croppedAreaPixels;
    const scale = 2;
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error("Could not prepare the cropped image.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      rotatedCanvas,
      x,
      y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = Math.round(
        pixels.data[index] * 0.299 +
          pixels.data[index + 1] * 0.587 +
          pixels.data[index + 2] * 0.114
      );

      pixels.data[index] = gray;
      pixels.data[index + 1] = gray;
      pixels.data[index + 2] = gray;
    }

    ctx.putImageData(pixels, 0, 0);

    return canvas;
  };

  const runOCR = async () => {
    setStep("processing");
    setProgress(0);

    try {
      const canvas = await createCroppedImage();

      if (!canvas) {
        throw new Error("Could not create cropped image.");
      }

      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round((message.progress || 0) * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: "6",
      });

      const result = await worker.recognize(canvas);

      const text = result.data.text;

      setOcrText(text);

      setAmount(extractAmount(text));

      await worker.terminate();

      setStep("review");
    } catch (error) {
      console.error("OCR error:", error);

      setStep("review");
    }
  };

  const resetScanner = () => {
    setImage(null);
    setCrop({
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setOcrText("");
    setAmount("");
    setCategory("Food");
    setDescription("");
    setProgress(0);
    setStep("upload");
  };

  const saveExpense = () => {
    if (!amount || Number(amount) <= 0) return;

    onExpenseDetected({
      id: Date.now(),
      amount: Number(amount),
      category,
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black">

      {/* ================= UPLOAD ================= */}

      {step === "upload" && (
        <div className="flex min-h-screen items-center justify-center p-5">

          <div className="w-full max-w-lg">

            <button
              onClick={onClose}
              className="mb-10 flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center sm:p-12">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900">
                <Upload size={30} />
              </div>

              <h2 className="mt-7 text-3xl font-black">
                Scan a receipt
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">
                Upload a receipt image and we'll extract the amount automatically.
              </p>

              <button
                onClick={() => inputRef.current?.click()}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-bold text-black transition hover:bg-zinc-200"
              >
                <Upload size={18} />
                CHOOSE IMAGE
              </button>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

            </div>

          </div>
        </div>
      )}

      {/* ================= CROP ================= */}

      {step === "crop" && image && (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col p-5">

          <div className="flex items-center justify-between py-3">

            <button
              onClick={resetScanner}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
            >
              <ArrowLeft size={16} />
              Choose another
            </button>

            <p className="text-sm font-bold">
              Crop receipt
            </p>

            <button
              onClick={onClose}
              className="text-sm text-zinc-500 hover:text-white"
            >
              Cancel
            </button>

          </div>

          <div className="relative mt-4 flex-1 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">

            <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black p-3">
              <ReactCrop
                crop={crop}
                onChange={(newCrop) => setCrop(newCrop)}
                onComplete={handleCropComplete}
                keepSelection
                ruleOfThirds
              >
                <img
                  src={image}
                  alt="Receipt"
                  className="max-h-[65vh] max-w-full object-contain transition-transform"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget;

                    setCroppedAreaPixels({
                      x: naturalWidth * 0.1,
                      y: naturalHeight * 0.1,
                      width: naturalWidth * 0.8,
                      height: naturalHeight * 0.8,
                    });
                  }}
                />
              </ReactCrop>
            </div>

          </div>

          <div className="mx-auto w-full max-w-2xl py-6">

            <div className="flex items-center gap-4">

              <ZoomIn size={17} className="text-zinc-500" />

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />

            </div>

            <div className="mt-5 flex gap-3">

              <button
                onClick={() => setRotation((value) => value + 90)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-800 py-4 font-semibold hover:bg-zinc-900"
              >
                <RotateCcw size={17} />
                ROTATE
              </button>

              <button
                onClick={runOCR}
                disabled={!croppedAreaPixels}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-30"
              >
                <Check size={18} />
                USE THIS CROP
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================= OCR ================= */}

      {step === "processing" && (
        <div className="flex min-h-screen items-center justify-center p-5">

          <div className="w-full max-w-md text-center">

            <div className="mx-auto h-20 w-20 animate-pulse rounded-3xl bg-zinc-900" />

            <h2 className="mt-7 text-3xl font-black">
              Scanning receipt
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              Reading text from your receipt...
            </p>

            <div className="mt-8 h-2 overflow-hidden rounded-full bg-zinc-900">

              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <p className="mt-3 text-sm text-zinc-600">
              {progress}%
            </p>

          </div>

        </div>
      )}

      {/* ================= REVIEW ================= */}

      {step === "review" && (
        <div className="flex min-h-screen items-center justify-center p-5">

          <div className="w-full max-w-lg">

            <button
              onClick={() => setStep("crop")}
              className="mb-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to crop
            </button>

            <h2 className="text-4xl font-black">
              Review expense
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              Check the extracted amount before adding it.
            </p>

            {/* Amount */}

            <div className="mt-8">

              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Amount
              </label>

              <div className="relative mt-2">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-600">
                  ₹
                </span>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-10 py-5 text-2xl font-bold outline-none focus:border-zinc-500"
                  placeholder="0.00"
                />

              </div>

            </div>

            {/* Category */}

            <div className="mt-7">

              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Category
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">

                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      category === item
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}

              </div>

            </div>

            {/* Description */}

            <div className="mt-7">

              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Lunch, groceries, movie..."
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 outline-none focus:border-zinc-500"
              />

            </div>

            {/* OCR text */}

            {ocrText && (
              <details className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <summary className="cursor-pointer text-sm font-semibold text-zinc-400">
                  View extracted text
                </summary>

                <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                  {ocrText}
                </pre>

              </details>
            )}

            <button
              onClick={saveExpense}
              disabled={!amount || Number(amount) <= 0}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Check size={18} />
              ADD EXPENSE
            </button>

          </div>

        </div>
      )}
    </div>
  );
}
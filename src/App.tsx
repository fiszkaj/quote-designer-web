import { useState, useEffect } from "react";

function applyPerspectiveTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  src: number[][],
  dst: number[][]
) {
  const w = img.width;
  const h = img.height;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;

      const tx =
        (1 - u) * (1 - v) * dst[0][0] +
        u * (1 - v) * dst[1][0] +
        (1 - u) * v * dst[2][0] +
        u * v * dst[3][0];

      const ty =
        (1 - u) * (1 - v) * dst[0][1] +
        u * (1 - v) * dst[1][1] +
        (1 - u) * v * dst[2][1] +
        u * v * dst[3][1];

      const pixel = img.getContext("2d")!.getImageData(x, y, 1, 1).data;
      ctx.fillStyle = `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3] / 255})`;
      ctx.fillRect(tx, ty, 1.5, 1.5);
    }
  }
}

export default function App() {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [quotes, setQuotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const libreBaskerville = new FontFace(
      "Libre Baskerville",
      "url(https://fonts.gstatic.com/s/librebaskerville/v14/kmKnZrc3Hgbbcjq75U4uslyuy4kn0qNZaxM.woff2)"
    );
    const latoBold = new FontFace(
      "Lato Bold",
      "url(https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2)"
    );
    const barlowCondensed = new FontFace(
  "Barlow Condensed",
  "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B4873.woff2)"
    );

    Promise.all([libreBaskerville.load(), latoBold.load(), barlowCondensed.load()]).then(([f1, f2, f3]) => {
      document.fonts.add(f1);
      document.fonts.add(f2);
      document.fonts.add(f3);
    });
      }, []);

  const extractQuotes = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    setQuotes([]);
    try {
      const response = await fetch(
        "https://quote-designer-backend.onrender.com/extract-quotes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const data = await response.json();
      setQuotes(data.quotes);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderQuoteToCanvas = (quote: string): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d")!;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-1.png";

    return canvas;
  };

  const [selectedTemplate, setSelectedTemplate] = useState<1 | 2>(1);

  const generateAndDownload = async (quote: string, index: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d")!;

  const bgUrl = selectedTemplate === 1
    ? "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-1.png"
    : "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-2.png";

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgUrl;
  await new Promise((resolve) => { img.onload = resolve; });
  ctx.drawImage(img, 0, 0, 1080, 1350);

  if (selectedTemplate === 1) {
    // Template 1 — regular centered text
    const fontSize = quote.length < 100 ? 70 : quote.length < 200 ? 55 : 40;
    ctx.font = `${fontSize}px "Libre Baskerville", Georgia, serif`;
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";

    const words = quote.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > 864 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = fontSize * 1.4;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (1350 - totalTextHeight) / 2 + fontSize;

    lines.forEach((line, i) => {
      ctx.fillText(line, 540, startY + i * lineHeight);
    });

    if (author.trim()) {
      ctx.font = `29px "Lato Bold", sans-serif`;
      ctx.letterSpacing = "10px";
      ctx.fillText(author.trim().toUpperCase(), 540, 1350 - 108);
    }

  } else {
    // Template 2 — billboard perspective transform
    const textCanvas = document.createElement("canvas");
    const billboardWidth = 900 - 145;
    const billboardHeight = 933 - 499;
    textCanvas.width = billboardWidth;
    textCanvas.height = billboardHeight;
    const tCtx = textCanvas.getContext("2d")!;

    let fontSize = 120;
let lines: string[] = [];

while (fontSize > 20) {
  tCtx.font = `bold ${fontSize}px "Barlow Condensed", sans-serif`;
  lines = [];
  let currentLine = "";
  const words = quote.toUpperCase().split(" ");

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (tCtx.measureText(testLine).width > billboardWidth - 40 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const totalHeight = lines.length * (fontSize * 0.89);
  if (totalHeight < billboardHeight - 40) break;
  fontSize -= 5;
}

tCtx.font = `bold ${fontSize}px "Barlow Condensed", sans-serif`;
tCtx.fillStyle = "#1a1a1a";
tCtx.textAlign = "center";

const lineHeight = fontSize * 0.89;
const totalTextHeight = lines.length * lineHeight;
const startY = (billboardHeight - totalTextHeight) / 2 + fontSize * 0.7;

lines.forEach((line, i) => {
  tCtx.fillText(line, billboardWidth / 2, startY + i * lineHeight);
});

    applyPerspectiveTransform(
      ctx,
      textCanvas,
      [[0, 0], [billboardWidth, 0], [0, billboardHeight], [billboardWidth, billboardHeight]],
      [[145, 499], [900, 564], [135, 928], [940, 933]]
    );
  }

  const link = document.createElement("a");
  link.download = `quote-${index + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Quote Designer</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Drop your transcript, article or podcast notes below</p>

      <textarea
        placeholder="Paste your long-form content here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        style={{ width: "100%", padding: 12, fontSize: 14, boxSizing: "border-box", marginBottom: 12, borderRadius: 8, border: "1px solid #ddd" }}
      />

      <input
        placeholder="Author name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        style={{ width: "100%", padding: 12, fontSize: 14, boxSizing: "border-box", marginBottom: 16, borderRadius: 8, border: "1px solid #ddd" }}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div
          onClick={() => setSelectedTemplate(1)}
          style={{
            flex: 1,
            padding: 12,
            border: `2px solid ${selectedTemplate === 1 ? "#7c3aed" : "#ddd"}`,
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "center",
            fontSize: 13,
            color: selectedTemplate === 1 ? "#7c3aed" : "#666",
          }}
        >
          Template 1
        </div>
        <div
          onClick={() => setSelectedTemplate(2)}
          style={{
            flex: 1,
            padding: 12,
            border: `2px solid ${selectedTemplate === 2 ? "#7c3aed" : "#ddd"}`,
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "center",
            fontSize: 13,
            color: selectedTemplate === 2 ? "#7c3aed" : "#666",
          }}
        >
          Billboard
        </div>
      </div>

      <button
        onClick={extractQuotes}
        disabled={loading}
        style={{ width: "100%", padding: 14, background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", marginBottom: 24 }}
      >
        {loading ? "Extracting..." : "Extract 5 Quotes"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {quotes.map((quote, index) => (
        <div key={index} style={{ marginBottom: 24, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Quote {index + 1}</p>
          <textarea
            value={quotes[index]}
            onChange={(e) => {
              const updated = [...quotes];
              updated[index] = e.target.value;
              setQuotes(updated);
            }}
            rows={3}
            style={{ width: "100%", padding: 10, fontSize: 14, boxSizing: "border-box", borderRadius: 6, border: "1px solid #ddd", marginBottom: 10 }}
          />
          <button
            onClick={() => generateAndDownload(quote, index)}
            style={{ width: "100%", padding: 12, background: "#f3f0ff", color: "#7c3aed", border: "1px solid #7c3aed", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
          >
            Download Quote Graphic
          </button>
        </div>
      ))}
    </div>
  );
}
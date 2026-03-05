import { useState, useEffect } from "react";

// ---- PERSPECTIVE TRANSFORM ----
function applyPerspectiveTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
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

// ---- TEMPLATE DEFINITIONS ----
const TEMPLATES = [
  { id: 1, name: "Texture", available: true },
  { id: 2, name: "Billboard", available: true },
  { id: 3, name: "Highlight Book", available: true },
  { id: 4, name: "Typewriter", available: true },
  { id: 5, name: "Coming Soon", available: false },
];

// ---- RENDER FUNCTION ----
async function renderQuote(quote: string, author: string, templateId: number): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d")!;

  const bgUrls: Record<number, string> = {
  1: "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-1.png",
  2: "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-2.png",
  3: "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-3.png",
  4: "https://raw.githubusercontent.com/fiszkaj/quote-app-assets/main/background-4.png",
};
const bgUrl = bgUrls[templateId] || bgUrls[1];

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgUrl;
  await new Promise((resolve) => { img.onload = resolve; });
  ctx.drawImage(img, 0, 0, 1080, 1350);

  if (templateId === 1) {
    // Texture template
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

  } else if (templateId === 2) {
    // Billboard template
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

    applyPerspectiveTransform(ctx, textCanvas, [
      [145, 499], [900, 564], [135, 928], [940, 933]
    ]);

} else if (templateId === 3) {
  // Highlight Book template
  const fontSize = 27 * 1.333; // pt to px
  const lineHeight = fontSize * 1.5;
  const maxWidth = 580;
  const leftMargin = 108;
  const highlightColor = "#e9ff2e";
  const xHeight = fontSize;
  const highlightPadding = 3;

  ctx.font = `${fontSize}px "EB Garamond", Georgia, serif`;
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";

  // Word wrap
  const words = quote.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Position in upper third
  const startY = 500;

  // Draw highlights first (x-height only)
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = highlightColor;
  lines.forEach((line, i) => {
    const lineWidth = ctx.measureText(line).width;
    ctx.fillRect(
      leftMargin - highlightPadding,
      startY + i * lineHeight - xHeight * 0.85,
      lineWidth + highlightPadding * 2,
      xHeight + highlightPadding * 2
    );
  });

  // Draw text on top
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1a1a1a";
  lines.forEach((line, i) => {
    ctx.fillText(line, leftMargin, startY + i * lineHeight);
  });

  // Author name — title case, em dash, same font
  if (author.trim()) {
    const titleCase = author.trim().replace(/\w\S*/g, (w) =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
    const authorText = `— ${titleCase}`;
    const authorY = startY + lines.length * lineHeight + lineHeight;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a1a1a";
    ctx.letterSpacing = "0px";
    ctx.font = `${fontSize}px "EB Garamond", Georgia, serif`;
    ctx.fillText(authorText, leftMargin, authorY);
  }

  } else if (templateId === 4) {
  const fontSize = 24 * 1.333;
  const lineHeight = fontSize * 1.6;
  const maxWidth = 600;
  const startY = 80 + fontSize;

  ctx.font = `${fontSize}px "Special Elite", serif`;
  ctx.fillStyle = "#493f3e";
  ctx.textAlign = "center";
  ctx.letterSpacing = "0px";

  // Word wrap
  const words = quote.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Draw quote
  lines.forEach((line, i) => {
    ctx.fillText(line, 540, startY + i * lineHeight);
  });

  // Author name
  if (author.trim()) {
    const titleCase = author.trim().replace(/\w\S*/g, (w) =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
    const authorY = startY + lines.length * lineHeight + lineHeight;
    ctx.fillText(`— ${titleCase}`, 540, authorY);
  }
}

  return canvas.toDataURL("image/png");
}

// ---- MAIN APP ----
export default function App() {
  const [step, setStep] = useState<"input" | "results">("input");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [quotes, setQuotes] = useState<string[]>([]);
  const [templates, setTemplates] = useState<number[]>([1, 2, 3, 4, 1]);
  const [previews, setPreviews] = useState<string[]>([]);
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
    const ebGaramond = new FontFace(
      "EB Garamond",
      "url(https://fonts.gstatic.com/s/ebgaramond/v26/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUA4V-e6yHgQ.woff2)"
    );
    const specialElite = new FontFace(
      "Special Elite",
      "url(https://fonts.gstatic.com/s/specialelite/v18/XLYgIZbkc46tvqgoxjTotC-GY-k.woff2)"
    );
    Promise.all([libreBaskerville.load(), latoBold.load(), barlowCondensed.load(), ebGaramond.load(), specialElite.load()])
      .then(([f1, f2, f3, f4, f5]) => {
        document.fonts.add(f1);
        document.fonts.add(f2);
        document.fonts.add(f3);
        document.fonts.add(f4);
        document.fonts.add(f5);
      });
  }, []);

  const extractQuotes = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
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
      setTemplates([1, 2, 3, 4, 1]);
      setStep("results");
      await document.fonts.ready;
      generatePreviews(data.quotes, [1, 2, 3, 4, 1]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generatePreviews = async (qs: string[], tmps: number[]) => {
    const newPreviews: string[] = [];
    for (let i = 0; i < qs.length; i++) {
      const dataUrl = await renderQuote(qs[i], author, tmps[i]);
      newPreviews.push(dataUrl);
    }
    setPreviews(newPreviews);
  };

  const refreshPreview = async (index: number) => {
    const dataUrl = await renderQuote(quotes[index], author, templates[index]);
    const updated = [...previews];
    updated[index] = dataUrl;
    setPreviews(updated);
  };

  const changeTemplate = async (index: number, templateId: number) => {
    const updated = [...templates];
    updated[index] = templateId;
    setTemplates(updated);
    const dataUrl = await renderQuote(quotes[index], author, templateId);
    const updatedPreviews = [...previews];
    updatedPreviews[index] = dataUrl;
    setPreviews(updatedPreviews);
  };

  const downloadQuote = async (index: number) => {
    const dataUrl = await renderQuote(quotes[index], author, templates[index]);
    const link = document.createElement("a");
    link.download = `quote-${index + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadAll = async () => {
    for (let i = 0; i < quotes.length; i++) {
      await downloadQuote(i);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Quote Designer</h1>
        <p style={{ color: "#888", margin: "4px 0 0" }}>Turn your content into beautiful quote graphics</p>
      </div>

      {/* STEP 1 — INPUT */}
      {step === "input" && (
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Your content
          </label>
          <textarea
            placeholder="Paste your transcript, article or podcast notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: 12, fontSize: 14, boxSizing: "border-box", marginBottom: 16, borderRadius: 8, border: "1px solid #ddd", resize: "vertical" }}
          />
          <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Author name <span style={{ fontWeight: 400, color: "#999" }}>(optional)</span>
          </label>
          <input
            placeholder="e.g. Juliette Fiszka"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            style={{ width: "100%", padding: 12, fontSize: 14, boxSizing: "border-box", marginBottom: 24, borderRadius: 8, border: "1px solid #ddd" }}
          />
          {error && <p style={{ color: "red", marginBottom: 16 }}>{error}</p>}
          <button
            onClick={extractQuotes}
            disabled={loading || !content.trim()}
            style={{ width: "100%", padding: 16, background: loading ? "#ccc" : "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Extracting quotes..." : "Extract 5 Quotes"}
          </button>
        </div>
      )}

      {/* STEP 2 — RESULTS */}
      {step === "results" && (
        <div>
          <button
            onClick={() => setStep("input")}
            style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 24 }}
          >
            ← Start over
          </button>

          {quotes.map((quote, index) => (
            <div key={index} style={{ marginBottom: 32, padding: 20, border: "1px solid #eee", borderRadius: 12 }}>
              
              {/* Quote number */}
              <p style={{ fontSize: 12, color: "#999", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>
                Quote {index + 1}
              </p>

              {/* Editable quote */}
              <textarea
                value={quotes[index]}
                onChange={(e) => {
                  const updated = [...quotes];
                  updated[index] = e.target.value;
                  setQuotes(updated);
                }}
                rows={3}
                style={{ width: "100%", padding: 10, fontSize: 14, boxSizing: "border-box", borderRadius: 6, border: "1px solid #ddd", marginBottom: 12, resize: "vertical" }}
              />

              {/* Template selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => t.available && changeTemplate(index, t.id)}
                    disabled={!t.available}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      border: `2px solid ${templates[index] === t.id ? "#7c3aed" : "#eee"}`,
                      borderRadius: 6,
                      background: t.available ? "white" : "#f9f9f9",
                      color: !t.available ? "#ccc" : templates[index] === t.id ? "#7c3aed" : "#666",
                      fontSize: 11,
                      cursor: t.available ? "pointer" : "not-allowed",
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Preview */}
              {previews[index] && (
                <img
                  src={previews[index]}
                  alt={`Quote ${index + 1} preview`}
                  style={{ width: "100%", maxWidth: 470, display: "block", margin: "0 auto 10px", borderRadius: 8 }}
                />
              )}

              {/* Refresh + Download */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => refreshPreview(index)}
                  style={{ flex: 1, padding: 10, background: "white", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#666" }}
                >
                  Refresh Preview
                </button>
                <button
                  onClick={() => downloadQuote(index)}
                  style={{ flex: 2, padding: 10, background: "#f3f0ff", border: "1px solid #7c3aed", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#7c3aed", fontWeight: 600 }}
                >
                  Download
                </button>
              </div>
            </div>
          ))}

          {/* Download All */}
          {quotes.length > 0 && (
            <button
              onClick={downloadAll}
              style={{ width: "100%", padding: 16, background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}
            >
              Download All 5 Quotes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
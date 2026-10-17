import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";

async function run() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sigPages = [4, 9, 15, 22, 28, 35, 41, 48, 52, 58, 62, 65, 68, 69];
  const spots = [ { x: 300, y: 600 }, { x: 60, y: 500 }, { x: 300, y: 300 }, { x: 60, y: 120 }, { x: 160, y: 590 }, { x: 300, y: 110 }, { x: 60, y: 340 } ];

  for (let i = 1; i <= 70; i++) {
    const page = pdfDoc.addPage([612, 792]);
    page.drawText("MASTER SERVICE AGREEMENT - PAGE " + i + " OF 70", { x: 50, y: 750, size: 15, font });
    let y = 700;
    for (let j = 0; j < 38; j++) {
      page.drawText("Clause " + i + "." + j + ": Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", { x: 50, y, size: 10, font });
      y -= 15;
    }
    if (sigPages.includes(i)) {
      const n = sigPages.indexOf(i) + 1;
      const s = spots[(n - 1) % spots.length];
      const bx = s.x, by = s.y, bw = 250, bh = 170;
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1.2 });
      page.drawText("SIGNATURE BLOCK " + n, { x: bx + 8, y: by + 152, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      page.drawText("SELLER: Akan Jan (greatmind20+live@gmail.com)", { x: bx + 8, y: by + 136, size: 8, font, color: rgb(0, 0, 0.9) });
      page.drawText("X", { x: bx + 8, y: by + 112, size: 12, font, color: rgb(0, 0, 0.9) });
      page.drawLine({ start: { x: bx + 22, y: by + 115 }, end: { x: bx + 150, y: by + 115 }, thickness: 1, color: rgb(0, 0, 0.9) });
      page.drawText("Seller Sign Here:", { x: bx + 22, y: by + 101, size: 7, font, color: rgb(0, 0, 0.7) });
      page.drawText("Date:", { x: bx + 155, y: by + 112, size: 8, font, color: rgb(0, 0, 0.9) });
      page.drawLine({ start: { x: bx + 183, y: by + 115 }, end: { x: bx + 242, y: by + 115 }, thickness: 1, color: rgb(0, 0, 0.9) });
      page.drawText("BUYER: Admire Fred (great_mind20@yahoo.com)", { x: bx + 8, y: by + 78, size: 8, font, color: rgb(0.9, 0, 0) });
      page.drawText("X", { x: bx + 8, y: by + 54, size: 12, font, color: rgb(0.9, 0, 0) });
      page.drawLine({ start: { x: bx + 22, y: by + 57 }, end: { x: bx + 150, y: by + 57 }, thickness: 1, color: rgb(0.9, 0, 0) });
      page.drawText("Buyer Sign Here:", { x: bx + 22, y: by + 43, size: 7, font, color: rgb(0.7, 0, 0) });
      page.drawText("Date:", { x: bx + 155, y: by + 54, size: 8, font, color: rgb(0.9, 0, 0) });
      page.drawLine({ start: { x: bx + 183, y: by + 57 }, end: { x: bx + 242, y: by + 57 }, thickness: 1, color: rgb(0.9, 0, 0) });
    }
    const label = "Page " + i + " of 70";
    const lw = font.widthOfTextAtSize(label, 10);
    page.drawText(label, { x: (612 - lw) / 2, y: 30, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  }
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync("Two-Party-Contract-70-Pages.pdf", pdfBytes);
  console.log("Generated with Akan Jan (blue) + Admire Fred (red)!");
}
run();
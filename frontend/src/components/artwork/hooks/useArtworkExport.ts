import { RefObject } from "react";
import html2canvas from "html2canvas";

export const useArtworkExport = (containerRef: RefObject<HTMLDivElement | null>, username: string) => {
  return async () => {
    if (!containerRef.current) return;
    const directCanvas = containerRef.current.querySelector("canvas") as HTMLCanvasElement | null;

    let dataUrl = "";
    if (directCanvas) {
      dataUrl = directCanvas.toDataURL("image/png");
    } else {
      const canvas = await html2canvas(containerRef.current, { backgroundColor: null });
      dataUrl = canvas.toDataURL("image/png");
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `digital-exhibition-${username || "profile"}.png`;
    link.click();
  };
};

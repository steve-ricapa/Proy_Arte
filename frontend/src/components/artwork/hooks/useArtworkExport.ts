import { RefObject } from "react";
import html2canvas from "html2canvas";

export const useArtworkExport = (containerRef: RefObject<HTMLDivElement | null>, username: string) => {
  return async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, { backgroundColor: null });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `digital-exhibition-${username || "profile"}.png`;
    link.click();
  };
};

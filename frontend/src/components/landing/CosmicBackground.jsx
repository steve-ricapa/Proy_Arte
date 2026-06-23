import { useEffect, useRef } from "react";

export default function CosmicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates and target for interpolation (parallax)
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Stars list
    const stars = [];
    const starCount = Math.min(100, Math.floor((width * height) / 12000));

    class Star {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : -10;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.05;
        this.speedY = Math.random() * 0.1 + 0.05;
        this.brightness = Math.random();
        this.brightnessSpeed = 0.005 + Math.random() * 0.015;
        this.depth = Math.random() * 0.6 + 0.4; // depth layer for parallax
      }

      update() {
        // Apply small drift
        this.x += this.speedX;
        this.y += this.speedY;

        // Twinkle brightness
        this.brightness += this.brightnessSpeed;
        if (this.brightness > 1 || this.brightness < 0) {
          this.brightnessSpeed = -this.brightnessSpeed;
        }

        // Loop if out of bounds
        if (this.y > height || this.x < 0 || this.x > width) {
          this.reset(false);
        }
      }

      draw(offsetX, offsetY) {
        const renderX = this.x + offsetX * this.depth;
        const renderY = this.y + offsetY * this.depth;

        ctx.beginPath();
        ctx.arc(renderX, renderY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, Math.max(0.1, this.brightness))})`;
        ctx.fill();

        // Glow for larger stars
        if (this.size > 1.8) {
          ctx.beginPath();
          ctx.arc(renderX, renderY, this.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(196, 181, 253, ${Math.min(1, Math.max(0.1, this.brightness * 0.15))})`;
          ctx.fill();
        }
      }
    }

    // Initialize stars
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }

    // Cosmic dust/nebula layers (Space purples/indigos)
    const nebulae = [
      { x: width * 0.25, y: height * 0.3, radius: Math.min(width, height) * 0.4, color: "rgba(124, 58, 237, 0.05)" },
      { x: width * 0.75, y: height * 0.6, radius: Math.min(width, height) * 0.5, color: "rgba(168, 85, 247, 0.04)" },
      { x: width * 0.5, y: height * 0.2, radius: Math.min(width, height) * 0.35, color: "rgba(139, 92, 246, 0.04)" },
    ];

    // Constellation lines max distance
    const maxDistance = 120;

    const render = () => {
      // Background gradient (pure black cosmos)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse parallax interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const offsetX = (width / 2 - mouse.x) * 0.03;
      const offsetY = (height / 2 - mouse.y) * 0.03;

      // Draw Nebula glows
      nebulae.forEach((nebula) => {
        const nx = nebula.x + offsetX * 0.2;
        const ny = nebula.y + offsetY * 0.2;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nebula.radius);
        grad.addColorStop(0, nebula.color);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and Draw Stars
      stars.forEach((star) => {
        star.update();
        star.draw(offsetX, offsetY);
      });

      // Draw constellation lines between close stars (Space purple lines)
      ctx.strokeStyle = "rgba(168, 85, 247, 0.06)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const s1 = stars[i];
          const s2 = stars[j];
          const x1 = s1.x + offsetX * s1.depth;
          const y1 = s1.y + offsetY * s1.depth;
          const x2 = s2.x + offsetX * s2.depth;
          const y2 = s2.y + offsetY * s2.depth;

          const dist = Math.hypot(x2 - x1, y2 - y1);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.15;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 block pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

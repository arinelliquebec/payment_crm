"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  maxWidth?: number;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  content,
  children,
  maxWidth = 400,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    // Calcular posição baseada na preferência
    let x = rect.left + rect.width / 2;
    let y = rect.top;

    if (position === "top") {
      y = rect.top - 10;
    } else if (position === "bottom") {
      y = rect.bottom + 10;
    } else if (position === "left") {
      x = rect.left - 10;
      y = rect.top + rect.height / 2;
    } else if (position === "right") {
      x = rect.right + 10;
      y = rect.top + rect.height / 2;
    }

    setTooltipPosition({ x, y });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Só mostrar tooltip se o conteúdo for diferente do texto exibido
  const shouldShowTooltip = content && content.length > 0;

  const getTransformOrigin = () => {
    switch (position) {
      case "top":
        return "bottom center";
      case "bottom":
        return "top center";
      case "left":
        return "right center";
      case "right":
        return "left center";
      default:
        return "bottom center";
    }
  };

  const getTransformStyle = () => {
    switch (position) {
      case "top":
        return "translate(-50%, -100%)";
      case "bottom":
        return "translate(-50%, 0%)";
      case "left":
        return "translate(-100%, -50%)";
      case "right":
        return "translate(0%, -50%)";
      default:
        return "translate(-50%, -100%)";
    }
  };

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && shouldShowTooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: getTransformStyle(),
            transformOrigin: getTransformOrigin(),
          }}
        >
          <div
            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg"
            style={{ maxWidth: `${maxWidth}px`, minWidth: "200px" }}
          >
            <div className="break-words whitespace-normal">{content}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
}

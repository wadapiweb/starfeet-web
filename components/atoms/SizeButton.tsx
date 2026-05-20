"use client";

import React from "react";

interface SizeButtonProps {
  size: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const SizeButton = ({ size, isSelected, onClick, disabled }: SizeButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-10 w-12 items-center justify-center rounded-lg border text-sm font-bold transition-all
        ${isSelected 
          ? "bg-starfeet-blue text-white border-starfeet-blue" 
          : "bg-gray-50 text-starfeet-blue border-transparent hover:border-gray-200 hover:bg-gray-100"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {size}
    </button>
  );
};

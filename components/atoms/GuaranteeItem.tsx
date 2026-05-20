"use client";

import React from "react";

interface GuaranteeItemProps {
  title: string;
  description?: string;
}

export const GuaranteeItem = ({ title, description }: GuaranteeItemProps) => {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-starfeet-blue">
        {/* Simple circle icon as per image */}
      </div>
      <div className="flex flex-col">
        <span className="font-sans text-sm font-black uppercase leading-tight text-starfeet-blue">
          {title}
        </span>
        {description && (
          <p className="mt-1 font-sans text-sm leading-snug text-gray-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

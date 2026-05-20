import React from "react";
import { Product } from "@prisma/client";
import { getProductTypeLabel } from "@/lib/product-types";
import Link from "next/link";

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const productUrl = `/producto/${product.slug || product.id}`;

    return (
        <Link href={productUrl} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 block">
            {/* IMAGE PLACEHOLDER FOR NOW */}
            <div className="aspect-square bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                    {/* Abstract shape representing the product type */}
                    <div className={`w-24 h-24 ${product.type === "STARFEET" ? "bg-starfeet-blue" : "bg-starfeet-lime"} opacity-20 blur-2xl absolute`}></div>
                    <span className="font-condensed font-black text-6xl text-starfeet-blue/10 uppercase select-none group-hover:text-starfeet-lime/20 transition-colors">
                        {getProductTypeLabel(product.type)}
                    </span>
                </div>

                {/* BADGE */}
                {product.compareAtPriceArs && (
                    <div className="absolute top-4 left-4 bg-starfeet-lime text-starfeet-blue font-condensed font-bold text-[10px] px-2 py-1 rounded uppercase tracking-tighter">
                        OFERTA
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-condensed font-bold text-xl text-starfeet-blue uppercase tracking-tight leading-none group-hover:text-starfeet-lime transition-colors">
                        {product.name}
                    </h3>
                    <span className="font-sans text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                        {getProductTypeLabel(product.type)}
                    </span>
                </div>

                <p className="font-sans text-xs text-starfeet-dark-100 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {product.description || "Tecnología de última generación diseñada para tu máximo rendimiento biomecánico."}
                </p>

                <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                        {product.compareAtPriceArs && (
                            <span className="font-sans text-[10px] text-gray-400 line-through">
                                ${Number(product.compareAtPriceArs).toLocaleString()} ARS
                            </span>
                        )}
                        <span className="font-condensed font-black text-2xl text-starfeet-blue leading-none">
                            ${Number(product.priceArs).toLocaleString()} <span className="text-[10px] font-bold text-gray-400">ARS</span>
                        </span>
                    </div>

                    <div className="w-10 h-10 bg-starfeet-blue text-white rounded-full flex items-center justify-center hover:bg-starfeet-lime hover:text-starfeet-blue transition-all group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
};

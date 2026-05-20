import Image from "next/image";

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
  variant?: "card" | "detail";
  className?: string;
};

export function ProductImageGallery({ images, alt, variant = "detail", className = "" }: ProductImageGalleryProps) {
  const hasImages = images.length > 0;
  const mainImage = images[0];

  if (!hasImages) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-500 ${
          variant === "card" ? "aspect-square" : "min-h-[240px]"
        } ${className}`}
      >
        Sin imágenes
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 ${className}`}>
        <div className="aspect-square">
          <Image src={mainImage} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
        <div className="relative aspect-[4/3]">
          <Image src={mainImage} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 60vw" />
        </div>
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
          {images.slice(1, 7).map((image, index) => (
            <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              <div className="relative aspect-square">
                <Image src={image} alt={`${alt} ${index + 2}`} fill className="object-cover" sizes="(max-width: 768px) 33vw, 12vw" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

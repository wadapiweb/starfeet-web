export type ProductTypeValue = "STARFEET" | "SLIPPER" | "OTHER";

export function getProductTypeLabel(type: ProductTypeValue) {
  switch (type) {
    case "SLIPPER":
      return "Pantufla";
    case "OTHER":
      return "Otro";
    case "STARFEET":
    default:
      return "Starfeet";
  }
}

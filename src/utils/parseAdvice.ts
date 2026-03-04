export interface ParsedAdvice {
  stock: string;
  price: string;
  why: string;
}

export function parseAdvice(raw: string): ParsedAdvice {
  const sections: ParsedAdvice = { stock: "", price: "", why: "" };
  const stockMatch = raw.match(/STOCK[:\s]*(.*?)(?=PRICE[:\s]|WHY[:\s]|$)/is);
  const priceMatch = raw.match(/PRICE[:\s]*(.*?)(?=WHY[:\s]|$)/is);
  const whyMatch = raw.match(/WHY[:\s]*(.*?)$/is);

  sections.stock = stockMatch?.[1]?.trim() || raw;
  sections.price = priceMatch?.[1]?.trim() || "";
  sections.why = whyMatch?.[1]?.trim() || "";
  return sections;
}

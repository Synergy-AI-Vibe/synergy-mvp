// TODO: Supabase(가격 API) 연동 전까지 사용하는 목업 데이터
// 02_동작규칙 7항 "재료 가격표는 18종 고정입니다" 기준 — 김치찌개 9개 재료(02 4항 표)는 문서 실측값을
// 그대로 쓰고, 나머지는 있는 재료로 찾기(SUB) 데모를 위해 같은 형식으로 채운 목업이다.

import type { IngredientPriceEntry } from "@/types/recibi";

export const PRICE_UPDATED_AT = "2026.09.01";

export const ingredientPriceTable: IngredientPriceEntry[] = [
  { id: "pork-neck", name: "돼지고기 목살", pantryLabel: "돼지고기", unitLabel: "냉장 목살 500g 팩", unitPrice: 7900, source: "참가격" },
  { id: "kimchi", name: "신김치", pantryLabel: "김치", unitLabel: "포기김치 900g", unitPrice: 8900, source: "참가격" },
  { id: "tofu", name: "두부", pantryLabel: "두부", unitLabel: "찌개용 1모 300g", unitPrice: 2180, source: "참가격" },
  { id: "green-onion", name: "대파", pantryLabel: "대파", unitLabel: "1단 3대 250g", unitPrice: 2480, source: "KAMIS" },
  { id: "onion", name: "양파", pantryLabel: "양파", unitLabel: "1.5kg 망", unitPrice: 3290, source: "KAMIS" },
  { id: "chili-powder", name: "고춧가루", pantryLabel: "고춧가루", unitLabel: "250g", unitPrice: 9800, source: "KAMIS" },
  { id: "minced-garlic", name: "다진마늘", pantryLabel: "마늘", unitLabel: "200g", unitPrice: 3200, source: "오픈마켓" },
  { id: "soup-soy-sauce", name: "국간장", pantryLabel: "국간장", unitLabel: "500ml", unitPrice: 4500, source: "오픈마켓" },
  { id: "egg", name: "계란", pantryLabel: "계란", unitLabel: "30구 특란", unitPrice: 7200, source: "참가격" },
  { id: "rice", name: "즉석밥", pantryLabel: "밥", unitLabel: "210g × 3입", unitPrice: 4200, source: "오픈마켓" },
  { id: "spam", name: "스팸", pantryLabel: "스팸", unitLabel: "200g 1캔", unitPrice: 5300, source: "오픈마켓" },
  { id: "sausage", name: "소시지", pantryLabel: "소시지", unitLabel: "1kg", unitPrice: 8900, source: "오픈마켓" },
  { id: "zucchini", name: "애호박", pantryLabel: "애호박", unitLabel: "1개", unitPrice: 1600, source: "KAMIS" },
  { id: "carrot", name: "당근", pantryLabel: "당근", unitLabel: "1개", unitPrice: 1200, source: "KAMIS" },
  { id: "gochujang", name: "고추장", pantryLabel: "고추장", unitLabel: "500g", unitPrice: 6500, source: "참가격" },
  { id: "tuna-can", name: "참치캔", pantryLabel: "참치", unitLabel: "150g × 3입", unitPrice: 6900, source: "오픈마켓" },
  { id: "mayo", name: "마요네즈", pantryLabel: "마요네즈", unitLabel: "500g", unitPrice: 4700, source: "오픈마켓" },
  { id: "bean-sprout", name: "콩나물", pantryLabel: "콩나물", unitLabel: "300g", unitPrice: 1800, source: "KAMIS" },
];

export function findIngredientPrice(id: string): IngredientPriceEntry | undefined {
  return ingredientPriceTable.find((entry) => entry.id === id);
}

/** 7-1 추천 칩 12개 고정 */
export const pantryRecommendedChips: string[] = [
  "돼지고기",
  "김치",
  "두부",
  "대파",
  "양파",
  "계란",
  "밥",
  "스팸",
  "소시지",
  "애호박",
  "당근",
  "고추장",
];

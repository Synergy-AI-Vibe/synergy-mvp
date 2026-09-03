// TODO: Supabase 연동 전까지 사용하는 목업 데이터
// 02_동작규칙 7-3 "후보 레시피는 7개 고정 목록입니다" — 값은 문서에 없어 ingredients.ts와 같은
// 재료 가격표를 기준으로 새로 채운 목업이다. name은 매칭 편의를 위해 pantryLabel(짧은 이름)을 쓴다.

import type { PantryRecipe } from "@/types/recibi";

export const pantryRecipes: PantryRecipe[] = [
  {
    id: "kimchi-jjigae",
    title: "돼지고기 김치찌개",
    eatOutPriceAvg: 22000,
    requiredIngredients: [
      { ingredientId: "pork-neck", name: "돼지고기", cost: 4740 },
      { ingredientId: "kimchi", name: "김치", cost: 3955 },
      { ingredientId: "tofu", name: "두부", cost: 2180 },
      { ingredientId: "green-onion", name: "대파", cost: 892 },
      { ingredientId: "onion", name: "양파", cost: 438 },
      { ingredientId: "chili-powder", name: "고춧가루", cost: 274 },
      { ingredientId: "minced-garlic", name: "마늘", cost: 240 },
      { ingredientId: "soup-soy-sauce", name: "국간장", cost: 135 },
    ],
  },
  {
    id: "kimchi-bokkeumbap",
    title: "김치볶음밥",
    eatOutPriceAvg: 9000,
    requiredIngredients: [
      { ingredientId: "kimchi", name: "김치", cost: 1800 },
      { ingredientId: "rice", name: "밥", cost: 1400 },
      { ingredientId: "pork-neck", name: "돼지고기", cost: 1500 },
      { ingredientId: "green-onion", name: "대파", cost: 300 },
      { ingredientId: "egg", name: "계란", cost: 1200 },
      { ingredientId: "gochujang", name: "고추장", cost: 400 },
    ],
  },
  {
    id: "jeyuk-bokkeum",
    title: "제육볶음",
    eatOutPriceAvg: 12000,
    requiredIngredients: [
      { ingredientId: "pork-neck", name: "돼지고기", cost: 5086 },
      { ingredientId: "onion", name: "양파", cost: 329 },
      { ingredientId: "green-onion", name: "대파", cost: 397 },
      { ingredientId: "gochujang", name: "고추장", cost: 520 },
      { ingredientId: "chili-powder", name: "고춧가루", cost: 392 },
      { ingredientId: "minced-garlic", name: "마늘", cost: 160 },
    ],
  },
  {
    id: "gyeranmari",
    title: "계란말이",
    eatOutPriceAvg: 6000,
    requiredIngredients: [
      { ingredientId: "egg", name: "계란", cost: 3600 },
      { ingredientId: "green-onion", name: "대파", cost: 200 },
      { ingredientId: "carrot", name: "당근", cost: 300 },
    ],
  },
  {
    id: "budae-jjigae",
    title: "부대찌개",
    eatOutPriceAvg: 13000,
    requiredIngredients: [
      { ingredientId: "spam", name: "스팸", cost: 3800 },
      { ingredientId: "sausage", name: "소시지", cost: 2900 },
      { ingredientId: "kimchi", name: "김치", cost: 2200 },
      { ingredientId: "onion", name: "양파", cost: 400 },
      { ingredientId: "tofu", name: "두부", cost: 1200 },
      { ingredientId: "minced-garlic", name: "마늘", cost: 160 },
      { ingredientId: "gochujang", name: "고추장", cost: 400 },
    ],
  },
  {
    id: "doenjang-jjigae",
    title: "된장찌개",
    eatOutPriceAvg: 10000,
    requiredIngredients: [
      { ingredientId: "tofu", name: "두부", cost: 1453 },
      { ingredientId: "zucchini", name: "애호박", cost: 800 },
      { ingredientId: "onion", name: "양파", cost: 219 },
      { ingredientId: "green-onion", name: "대파", cost: 298 },
      { ingredientId: "minced-garlic", name: "마늘", cost: 160 },
    ],
  },
  {
    id: "chamchi-mayo-deopbap",
    title: "참치마요덮밥",
    eatOutPriceAvg: 7000,
    requiredIngredients: [
      { ingredientId: "tuna-can", name: "참치", cost: 2300 },
      { ingredientId: "mayo", name: "마요네즈", cost: 470 },
      { ingredientId: "rice", name: "밥", cost: 1400 },
    ],
  },
];

// 가격 시드 스냅샷. 실제 시세가 아니라 UI·계산 흐름 검증용 대체물이다.
//
// JSON 이 아니라 JS 모듈인 이유: 서버리스 번들에서 readFileSync 로 JSON 을 읽으면
// 파일이 번들에 안 들어가 import 시점에 터진다. 모듈로 두면 번들러가 추적한다.
// KAMIS·참가격 실 API 를 붙일 때는 price/index.js 의 tier1 조회부만 갈아끼우면 된다.

export default {
  "_meta": {
    "note": "공공 API 키를 아직 안 붙였을 때 UI/계산 흐름을 검증하기 위한 시드 스냅샷입니다. 실제 시세가 아니라 '있을 법한 값'이며, KAMIS/참가격 어댑터가 붙으면 tier1이 이 값을 대체합니다.",
    "asOf": "2026-09-01",
    "currency": "KRW"
  },
  "items": {
    "돼지고기": {
      "per": "g",
      "unitPrice": 18.5,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 9250,
        "label": "500g 팩"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 축산물(돼지 삼겹살) 소매가 기준 시드"
    },
    "소고기": {
      "per": "g",
      "unitPrice": 42,
      "pack": {
        "size": 300,
        "unit": "g",
        "price": 12600,
        "label": "300g 팩"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 축산물 소매가 기준 시드"
    },
    "차돌박이": {
      "per": "g",
      "unitPrice": 38,
      "pack": {
        "size": 300,
        "unit": "g",
        "price": 11400,
        "label": "300g 팩"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 축산물 소매가 기준 시드"
    },
    "닭": {
      "per": "g",
      "unitPrice": 7.5,
      "pack": {
        "size": 1000,
        "unit": "g",
        "price": 7500,
        "label": "1마리(1kg)"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 축산물(육계) 소매가 기준 시드"
    },
    "달걀": {
      "per": "g",
      "unitPrice": 6.4,
      "pack": {
        "size": 550,
        "unit": "g",
        "price": 3500,
        "label": "10구 한 판"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 계란 소매가 기준 시드"
    },
    "두부": {
      "per": "g",
      "unitPrice": 6,
      "pack": {
        "size": 300,
        "unit": "g",
        "price": 1800,
        "label": "1모(300g)"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "양파": {
      "per": "g",
      "unitPrice": 2.6,
      "pack": {
        "size": 1500,
        "unit": "g",
        "price": 3900,
        "label": "1.5kg 망"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "감자": {
      "per": "g",
      "unitPrice": 4.2,
      "pack": {
        "size": 1000,
        "unit": "g",
        "price": 4200,
        "label": "1kg"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "당근": {
      "per": "g",
      "unitPrice": 4,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 2000,
        "label": "500g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "대파": {
      "per": "g",
      "unitPrice": 4.5,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 2250,
        "label": "1단(500g)"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "애호박": {
      "per": "g",
      "unitPrice": 6,
      "pack": {
        "size": 250,
        "unit": "g",
        "price": 1500,
        "label": "1개"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "청양고추": {
      "per": "g",
      "unitPrice": 20,
      "pack": {
        "size": 100,
        "unit": "g",
        "price": 2000,
        "label": "100g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "홍고추": {
      "per": "g",
      "unitPrice": 22,
      "pack": {
        "size": 100,
        "unit": "g",
        "price": 2200,
        "label": "100g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "마늘": {
      "per": "g",
      "unitPrice": 14,
      "pack": {
        "size": 200,
        "unit": "g",
        "price": 2800,
        "label": "깐마늘 200g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 양념채소 소매가 기준 시드"
    },
    "김치": {
      "per": "g",
      "unitPrice": 8,
      "pack": {
        "size": 1000,
        "unit": "g",
        "price": 8000,
        "label": "포기김치 1kg"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "시금치": {
      "per": "g",
      "unitPrice": 9,
      "pack": {
        "size": 200,
        "unit": "g",
        "price": 1800,
        "label": "1단(200g)"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "당면": {
      "per": "g",
      "unitPrice": 8.5,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 4250,
        "label": "500g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "떡볶이떡": {
      "per": "g",
      "unitPrice": 5.5,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 2750,
        "label": "500g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "어묵": {
      "per": "g",
      "unitPrice": 9,
      "pack": {
        "size": 400,
        "unit": "g",
        "price": 3600,
        "label": "400g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "표고버섯": {
      "per": "g",
      "unitPrice": 16,
      "pack": {
        "size": 150,
        "unit": "g",
        "price": 2400,
        "label": "150g"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 버섯류 소매가 기준 시드"
    },
    "목이버섯": {
      "per": "g",
      "unitPrice": 25,
      "pack": {
        "size": 100,
        "unit": "g",
        "price": 2500,
        "label": "건조 100g"
      },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "파프리카": {
      "per": "g",
      "unitPrice": 8,
      "pack": {
        "size": 180,
        "unit": "g",
        "price": 1440,
        "label": "1개"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 채소류 소매가 기준 시드"
    },
    "밀가루": {
      "per": "g",
      "unitPrice": 2,
      "pack": {
        "size": 1000,
        "unit": "g",
        "price": 2000,
        "label": "1kg (박력분)"
      },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드(박력분·중력분·강력분 공통 근사)"
    },
    "쌀": {
      "per": "g",
      "unitPrice": 3.2,
      "pack": {
        "size": 4000,
        "unit": "g",
        "price": 12800,
        "label": "4kg"
      },
      "category": "주재료",
      "sourceTier": 1,
      "sourceName": "KAMIS 식량작물 소매가 기준 시드"
    },
    "간장": {
      "per": "ml",
      "unitPrice": 4.5,
      "pack": {
        "size": 500,
        "unit": "ml",
        "price": 2250,
        "label": "500ml"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "고추장": {
      "per": "g",
      "unitPrice": 9,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 4500,
        "label": "500g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "된장": {
      "per": "g",
      "unitPrice": 7,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 3500,
        "label": "500g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "고춧가루": {
      "per": "g",
      "unitPrice": 32,
      "pack": {
        "size": 250,
        "unit": "g",
        "price": 8000,
        "label": "250g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "KAMIS 양념류 소매가 기준 시드"
    },
    "설탕": {
      "per": "g",
      "unitPrice": 2.4,
      "pack": {
        "size": 1000,
        "unit": "g",
        "price": 2400,
        "label": "1kg"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "소금": {
      "per": "g",
      "unitPrice": 2,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 1000,
        "label": "500g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "식용유": {
      "per": "ml",
      "unitPrice": 5,
      "pack": {
        "size": 900,
        "unit": "ml",
        "price": 4500,
        "label": "900ml"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "참기름": {
      "per": "ml",
      "unitPrice": 30,
      "pack": {
        "size": 320,
        "unit": "ml",
        "price": 9600,
        "label": "320ml"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "들기름": {
      "per": "ml",
      "unitPrice": 34,
      "pack": {
        "size": 320,
        "unit": "ml",
        "price": 10880,
        "label": "320ml"
      },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "물엿": {
      "per": "g",
      "unitPrice": 3.6,
      "pack": {
        "size": 700,
        "unit": "g",
        "price": 2520,
        "label": "700g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "맛술": {
      "per": "ml",
      "unitPrice": 4,
      "pack": {
        "size": 500,
        "unit": "ml",
        "price": 2000,
        "label": "500ml"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "멸치액젓": {
      "per": "ml",
      "unitPrice": 5.5,
      "pack": {
        "size": 500,
        "unit": "ml",
        "price": 2750,
        "label": "500ml"
      },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "굴소스": {
      "per": "g",
      "unitPrice": 8,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 4000,
        "label": "500g"
      },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "후추": {
      "per": "g",
      "unitPrice": 60,
      "pack": {
        "size": 50,
        "unit": "g",
        "price": 3000,
        "label": "50g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "통깨": {
      "per": "g",
      "unitPrice": 30,
      "pack": {
        "size": 100,
        "unit": "g",
        "price": 3000,
        "label": "100g"
      },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "케첩": {
      "per": "g",
      "unitPrice": 4,
      "pack": {
        "size": 500,
        "unit": "g",
        "price": 2000,
        "label": "500g"
      },
      "category": "조미료",
      "sourceTier": 1,
      "sourceName": "참가격 가공식품 기준 시드"
    },
    "버터": {
      "per": "g",
      "unitPrice": 32,
      "pack": {
        "size": 227,
        "unit": "g",
        "price": 7264,
        "label": "227g"
      },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드(브랜드별 편차 큼)"
    },
    "카레가루": {
      "per": "g",
      "unitPrice": 24,
      "pack": {
        "size": 100,
        "unit": "g",
        "price": 2400,
        "label": "1팩(100g)"
      },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "코인육수": {
      "per": "g",
      "unitPrice": 75,
      "pack": {
        "size": 80,
        "unit": "g",
        "price": 6000,
        "label": "20알"
      },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "다시다": {
      "per": "g",
      "unitPrice": 12,
      "pack": {
        "size": 300,
        "unit": "g",
        "price": 3600,
        "label": "300g"
      },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "오픈마켓 시세 기준 시드"
    },
    "물": {
      "per": "ml",
      "unitPrice": 0,
      "pack": null,
      "category": "무시",
      "sourceTier": 0,
      "sourceName": "수돗물/정수 — 비용 0원 처리"
    },
    "부침가루": {
      "per": "g",
      "unitPrice": 3.38,
      "pack": { "size": 1000, "unit": "g", "price": 3380, "label": "1kg 봉" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (백설 1kg)"
    },
    "즉석밥": {
      "per": "g",
      "unitPrice": 4.57,
      "pack": { "size": 2520, "unit": "g", "price": 11520, "label": "210g×12입" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "다나와 최저가 조사 2026-09-03 (햇반 210g×12)"
    },
    "스팸": {
      "per": "g",
      "unitPrice": 16,
      "pack": { "size": 200, "unit": "g", "price": 3200, "label": "200g 캔" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "쿠팡 조사 2026-09-03 (클래식 8캔 25,600원 환산)"
    },
    "사골육수": {
      "per": "ml",
      "unitPrice": 1.96,
      "pack": { "size": 500, "unit": "ml", "price": 980, "label": "500ml 팩" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (노브랜드 500g)"
    },
    "들깨가루": {
      "per": "g",
      "unitPrice": 37,
      "pack": { "size": 200, "unit": "g", "price": 7400, "label": "200g(탈피)" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (해가원 200g)"
    },
    "소주": {
      "per": "ml",
      "unitPrice": 3.69,
      "pack": { "size": 360, "unit": "ml", "price": 1330, "label": "360ml 병" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트 소매가 (2024-01 확인, 최신 재조사 권장)"
    },
    "레몬": {
      "per": "g",
      "unitPrice": 11.8,
      "pack": { "size": 100, "unit": "g", "price": 1180, "label": "1개(약 100g)" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (미국산 낱개)"
    },
    "밀가루": {
      "per": "g",
      "unitPrice": 1.71,
      "pack": { "size": 1000, "unit": "g", "price": 1710, "label": "1kg (중력분)" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (백설 중력 1kg)"
    },
    "전분": {
      "per": "g",
      "unitPrice": 5.5,
      "pack": { "size": 500, "unit": "g", "price": 2750, "label": "500g" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "SSG 조사 2026-09-03 (혼합 감자전분 500g)"
    },
    "튀김가루": {
      "per": "g",
      "unitPrice": 3.4,
      "pack": { "size": 1000, "unit": "g", "price": 3400, "label": "1kg" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (오뚜기 1kg)"
    },
    "빵가루": {
      "per": "g",
      "unitPrice": 7.36,
      "pack": { "size": 500, "unit": "g", "price": 3680, "label": "500g" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (오뚜기 500g)"
    },
    "마요네즈": {
      "per": "g",
      "unitPrice": 13.16,
      "pack": { "size": 500, "unit": "g", "price": 6580, "label": "500g" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (오뚜기 골드 500g)"
    },
    "식초": {
      "per": "ml",
      "unitPrice": 1.89,
      "pack": { "size": 900, "unit": "ml", "price": 1700, "label": "900ml" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (오뚜기 양조식초 900ml)"
    },
    "올리브유": {
      "per": "ml",
      "unitPrice": 22.96,
      "pack": { "size": 500, "unit": "ml", "price": 11480, "label": "500ml" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (올리브오일 500ml)"
    },
    "꿀": {
      "per": "g",
      "unitPrice": 28,
      "pack": { "size": 600, "unit": "g", "price": 16800, "label": "600g (아카시아)" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (그린푸드 아카시아 600g)"
    },
    "우유": {
      "per": "ml",
      "unitPrice": 4.76,
      "pack": { "size": 1000, "unit": "ml", "price": 4760, "label": "1L" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "조사 2026-09-03 (서울우유 1L)"
    },
    "생크림": {
      "per": "ml",
      "unitPrice": 11.92,
      "pack": { "size": 500, "unit": "ml", "price": 5960, "label": "500ml" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "다나와 조사 2026-09-03 (서울우유 500ml)"
    },
    "모짜렐라치즈": {
      "per": "g",
      "unitPrice": 17.98,
      "pack": { "size": 1000, "unit": "g", "price": 17980, "label": "1kg (슈레드)" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (서울우유 슈레드 1kg)"
    },
    "슬라이스치즈": {
      "per": "g",
      "unitPrice": 24.94,
      "pack": { "size": 360, "unit": "g", "price": 8980, "label": "20매(360g)" },
      "category": "조미료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (동원 체다 360g)"
    },
    "참치캔": {
      "per": "g",
      "unitPrice": 18.33,
      "pack": { "size": 150, "unit": "g", "price": 2749, "label": "150g 캔" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "SSG 조사 2026-09-03 (동원 10캔 27,490원 환산)"
    },
    "파스타면": {
      "per": "g",
      "unitPrice": 3.8,
      "pack": { "size": 500, "unit": "g", "price": 1900, "label": "500g" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "11번가 조사 2026-09-03 (오뚜기 스파게티면 500g)"
    },
    "소면": {
      "per": "g",
      "unitPrice": 10.53,
      "pack": { "size": 900, "unit": "g", "price": 9476, "label": "900g" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (오뚜기 옛날국수 900g — 타 판매처 대비 높은 편, 재확인 권장)"
    },
    "만두": {
      "per": "g",
      "unitPrice": 10.46,
      "pack": { "size": 1050, "unit": "g", "price": 10980, "label": "1.05kg (왕교자)" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "CJ더마켓 조사 2026-09-03 (비비고 왕교자 정상가)"
    },
    "라면사리": {
      "per": "g",
      "unitPrice": 3.75,
      "pack": { "size": 550, "unit": "g", "price": 2060, "label": "110g×5개" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (오뚜기 5입)"
    },
    "베이컨": {
      "per": "g",
      "unitPrice": 24.92,
      "pack": { "size": 240, "unit": "g", "price": 5980, "label": "120g×2" },
      "category": "주재료",
      "sourceTier": 2,
      "sourceName": "이마트몰 조사 2026-09-03 (대림 브런치베이컨 240g)"
    }
  }
};

/**
 * 매장가 조회 — 레시피 제목으로 메뉴 카테고리를 매칭합니다.
 *
 * DB의 match_store_price() 가 가장 긴 별칭이 걸린 행을 고릅니다.
 * ('돼지고기김치찌개' 가 '김치찌개' 를 이깁니다)
 *
 * is_verified = true 인 행만 반환하므로, 조사 안 된 메뉴는 null 이 나오고
 * 화면은 r1 의 비교 영역을 접습니다.
 */

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StorePrice } from '@/types/api'

export async function matchStorePrice(recipeTitle: string): Promise<StorePrice | null> {
  const db = createAdminClient()

  const { data, error } = await db.rpc('match_store_price', { recipe_title: recipeTitle })

  if (error) {
    console.warn('[matchStorePrice]', error.message)
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || row.price_avg === null) return null

  return {
    menuName: row.menu_name,
    min: row.price_min ?? row.price_avg,
    max: row.price_max ?? row.price_avg,
    avg: row.price_avg,
    deliveryFee: row.delivery_fee,
    sampleSize: row.sample_size,
    surveyedOn: row.surveyed_on ?? '',
  }
}

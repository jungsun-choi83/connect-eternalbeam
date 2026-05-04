import type { SubscriberDashboardPayload } from './subscriberApi'

const day = 24 * 60 * 60 * 1000

/** API·Railway 없이 UI만 볼 때 쓰는 샘플 데이터 */
export function mockSubscriberDashboardPayload(): SubscriberDashboardPayload {
  const now = Date.now()
  const monthly: SubscriberDashboardPayload['archive_entries'][0] = {
    id: 'mock-m1',
    source: 'monthly',
    body:
      '안녕, 우리 가족.\n\n오늘은 가을 햇살이 창가에 잘도 내려앉더라. 네가 좋아하던 그 자리에.\n\n다음에도 이어질 이야기가 기다리고 있어.',
    arrived_at: now - 2 * day,
    title: '이번 달의 편지',
    cycle_index: 1,
  }

  return {
    child_name: '별이',
    profile_photo: null,
    archive_entries: [
      monthly,
      {
        id: 'mock-s1',
        source: 'soultrace',
        body: '처음 남긴 편지 한 줌이 여기까지 왔어요.',
        arrived_at: now - 30 * day,
        title: 'Soultrace',
      },
    ],
    photos: [],
    memories: [
      {
        id: 'mock-mem1',
        date_iso: new Date(now - 5 * day).toISOString().slice(0, 10),
        text: '산책 갔다 와서 발 닦던 그날.',
        created_at: now - 5 * day,
      },
    ],
    subscription: { active: true, since: now - 60 * day },
    next_letter_eta_ms: 18 * day + 7 * 60 * 60 * 1000,
    latest_monthly: monthly,
  }
}


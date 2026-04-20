/** API 베이스 (프로덕션: 동일 오리진이면 빈 문자열) */
export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE ?? ''
}

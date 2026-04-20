/**
 * 소울트레이스 앱: 기기 등록(클레임) 후 시리얼을 저장해 두면
 * 편지 결과 화면에서 [지금 내 기기로 보내기]를 활성화할 수 있습니다.
 */
export const DEVICE_STORAGE_KEY = 'eternalbeam_device_sn'

/** @deprecated 호환용 */
export const DEVICE_STORAGE_KEY_LEGACY = 'eternalbeam_device_id'

export function getBoundDeviceSn(): string | null {
  try {
    const v =
      localStorage.getItem(DEVICE_STORAGE_KEY)?.trim() ||
      localStorage.getItem(DEVICE_STORAGE_KEY_LEGACY)?.trim()
    return v || null
  } catch {
    return null
  }
}

export function setBoundDeviceSn(deviceSn: string): void {
  localStorage.setItem(DEVICE_STORAGE_KEY, deviceSn.trim())
  localStorage.removeItem(DEVICE_STORAGE_KEY_LEGACY)
}

export function clearBoundDeviceSn(): void {
  localStorage.removeItem(DEVICE_STORAGE_KEY)
  localStorage.removeItem(DEVICE_STORAGE_KEY_LEGACY)
}

/** @deprecated use getBoundDeviceSn */
export function getBoundDeviceId(): string | null {
  return getBoundDeviceSn()
}

/** @deprecated use setBoundDeviceSn */
export function setBoundDeviceId(deviceId: string): void {
  setBoundDeviceSn(deviceId)
}

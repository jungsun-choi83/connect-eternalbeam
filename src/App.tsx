import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { LetterSavedConfirmation } from './components/LetterSavedConfirmation'
import { MobileEmotionFunnel } from './components/MobileEmotionFunnel'
import { SoftArchivePrompt } from './components/anonymous/SoftArchivePrompt'
import { saveConnectLetter } from './lib/connectLettersApi'
import { resolveActiveAnonId } from './lib/anonymousSession'
import { startTossUpsellCheckout } from './lib/tossCheckout'
import {
  type SoulTracePayload,
  syncSoulTraceFromSearchParams,
} from './lib/soulTraceIngest'
import { DisplayPage } from './pages/DisplayPage'
import { LetterResultDemoPage } from './pages/LetterResultDemoPage'
import { OAuthGoogleCallbackPage } from './pages/OAuthGoogleCallback'
import { OAuthKakaoCallbackPage } from './pages/OAuthKakaoCallback'
import { QrToolPage } from './pages/QrToolPage'
import { RegisterDevicePage } from './pages/RegisterDevicePage'
import { RegisterSerialPage } from './pages/RegisterSerialPage'
import { SubscriptionEmotionPage } from './pages/SubscriptionEmotionPage'
import { TossPaymentFailPage } from './pages/TossPaymentFailPage'
import { TossPaymentSuccessPage } from './pages/TossPaymentSuccessPage'

function Landing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const activeAnonId = resolveActiveAnonId(searchParams)
  const [soul, setSoul] = useState<SoulTracePayload>(() => {
    if (typeof window === 'undefined') {
      return { letter: null, email: null, deviceId: null }
    }
    return syncSoulTraceFromSearchParams(new URLSearchParams(window.location.search))
  })
  const [letterSaved, setLetterSaved] = useState(false)

  useEffect(() => {
    setSoul(syncSoulTraceFromSearchParams(searchParams))
  }, [searchParams])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    for (const key of [
      'letter',
      'letter_content',
      'st_letter',
      'message',
      'content',
      'final_letter',
      'lastLetter',
      'payload',
    ]) {
      if (next.has(key)) {
        next.delete(key)
        changed = true
      }
    }
    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const trySaveSoulLetter = async (): Promise<void> => {
    const payload = syncSoulTraceFromSearchParams(searchParams)
    if (!payload.letter?.trim() || !payload.email?.trim()) {
      return
    }
    try {
      await saveConnectLetter({
        user_email: payload.email,
        letter_content: payload.letter,
        device_id: payload.deviceId,
      })
      setLetterSaved(true)
      window.setTimeout(() => setLetterSaved(false), 6500)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '편지 기록 저장에 실패했습니다.')
    }
  }

  const handleSubscriptionOnly = async (email: string) => {
    await trySaveSoulLetter()
    // 테스트 모드: 결제창을 건너뛰고 바로 편지 화면으로 진입
    navigate(`/subscription?email=${encodeURIComponent(email)}`)
  }

  const handleUpgrade = async (email: string) => {
    await trySaveSoulLetter()
    await startTossUpsellCheckout(email)
  }

  return (
    <div className="min-h-dvh text-white">
      <LetterSavedConfirmation visible={letterSaved} />
      <MobileEmotionFunnel
        payload={soul}
        onStartSubscription={handleSubscriptionOnly}
        onUpgrade={handleUpgrade}
      />
      <SoftArchivePrompt anonId={activeAnonId} />
    </div>
  )
}

function App() {
  const [showLoader, setShowLoader] = useState(true)
  const [fadeOutLoader, setFadeOutLoader] = useState(false)
  const [loadingText, setLoadingText] = useState('빛이 가까워지고 있어요')

  useEffect(() => {
    let textTimer: number | null = null
    let fadeTimer: number | null = null
    let hideTimer: number | null = null

    const startHideSequence = () => {
      textTimer = window.setTimeout(() => {
        setLoadingText('아이의 메시지가 도착하고 있어요')
      }, 900)
      fadeTimer = window.setTimeout(() => {
        setFadeOutLoader(true)
        hideTimer = window.setTimeout(() => setShowLoader(false), 500)
      }, 2000)
    }

    if (document.readyState === 'complete') {
      startHideSequence()
    } else {
      window.addEventListener('load', startHideSequence, { once: true })
    }

    return () => {
      window.removeEventListener('load', startHideSequence)
      if (textTimer !== null) window.clearTimeout(textTimer)
      if (fadeTimer !== null) window.clearTimeout(fadeTimer)
      if (hideTimer !== null) window.clearTimeout(hideTimer)
    }
  }, [])

  return (
    <>
      {showLoader && (
        <div id="loading-screen" className={fadeOutLoader ? 'is-fading-out' : ''}>
          <div className="light" />
          <div className="loading-text">{loadingText}</div>
        </div>
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/connect/:id" element={<Landing />} />
          <Route path="/display/:deviceSn" element={<DisplayPage />} />
          <Route path="/register/:serial" element={<RegisterSerialPage />} />
          <Route path="/register-device" element={<RegisterDevicePage />} />
          <Route path="/demo/letter" element={<LetterResultDemoPage />} />
          <Route path="/oauth/google/callback" element={<OAuthGoogleCallbackPage />} />
          <Route path="/oauth/kakao/callback" element={<OAuthKakaoCallbackPage />} />
          <Route path="/payments/toss/success" element={<TossPaymentSuccessPage />} />
          <Route path="/payments/toss/fail" element={<TossPaymentFailPage />} />
          <Route path="/subscription" element={<SubscriptionEmotionPage />} />
          <Route path="/tools/qr/:deviceSn" element={<QrToolPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

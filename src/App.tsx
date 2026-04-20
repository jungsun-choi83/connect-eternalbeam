import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { ConnectCtaSection } from './components/ConnectCtaSection'
import { FeatureSection } from './components/FeatureSection'
import { LetterSavedConfirmation } from './components/LetterSavedConfirmation'
import { PreparingBanner } from './components/PreparingBanner'
import { ProductSection } from './components/ProductSection'
import { ProductShowcase } from './components/ProductShowcase'
import { SoulTraceLetterHero } from './components/SoulTraceLetterHero'
import { StickyMobileCta } from './components/StickyMobileCta'
import { SubscriptionSection } from './components/SubscriptionSection'
import { AnonLetterPreview } from './components/anonymous/AnonLetterPreview'
import { OrderAutoAccountCard } from './components/anonymous/OrderAutoAccountCard'
import { SoftArchivePrompt } from './components/anonymous/SoftArchivePrompt'
import { saveConnectLetter } from './lib/connectLettersApi'
import { getOrCreateAnonId, resolveActiveAnonId } from './lib/anonymousSession'
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

function Landing() {
  const [searchParams] = useSearchParams()
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

  const scrollToConnect = () => {
    document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const handleConnect = async () => {
    await trySaveSoulLetter()
    window.alert('결제·예약 연동 예정입니다. 킥스타터 오픈 시 이 자리에서 안내드릴게요.')
  }

  const handlePackage = async () => {
    await trySaveSoulLetter()
    const id = getOrCreateAnonId()
    navigate(
      { pathname: '/', search: `?anonId=${encodeURIComponent(id)}`, hash: '#order' },
      { replace: true },
    )
    requestAnimationFrame(() => {
      document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const handleSubscriptionOnly = async () => {
    await trySaveSoulLetter()
    window.alert('전송 서비스 구독 연동 예정입니다. 런칭 시 이 자리에서 이어집니다.')
  }

  return (
    <div className="min-h-dvh text-white">
      <PreparingBanner />
      <LetterSavedConfirmation visible={letterSaved} />
      {soul.letter?.trim() || soul.email?.trim() ? (
        <SoulTraceLetterHero payload={soul} />
      ) : (
        <AnonLetterPreview anonId={activeAnonId} />
      )}
      <main className="pb-[5.85rem] sm:pb-0">
        <ProductShowcase />
        <ProductSection
          onPackagePurchase={handlePackage}
          onSubscription={handleSubscriptionOnly}
        />
        <div className="border-b border-[#D4AF37]/10 px-8 pb-24 pt-4 md:px-12">
          <OrderAutoAccountCard />
        </div>
        <ConnectCtaSection onConnect={handleConnect} />
        <FeatureSection />
        <SubscriptionSection />
      </main>
      <SoftArchivePrompt anonId={activeAnonId} />
      <StickyMobileCta onClick={scrollToConnect} />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/display/:deviceSn" element={<DisplayPage />} />
        <Route path="/register/:serial" element={<RegisterSerialPage />} />
        <Route path="/register-device" element={<RegisterDevicePage />} />
        <Route path="/demo/letter" element={<LetterResultDemoPage />} />
        <Route path="/oauth/google/callback" element={<OAuthGoogleCallbackPage />} />
        <Route path="/oauth/kakao/callback" element={<OAuthKakaoCallbackPage />} />
        <Route path="/tools/qr/:deviceSn" element={<QrToolPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

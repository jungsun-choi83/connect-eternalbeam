type Props = {
  visible: boolean
}

export function LetterSavedConfirmation({ visible }: Props) {
  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4 sm:top-24">
      <div
        className="pointer-events-auto max-w-md rounded-xl border border-[#D4AF37]/30 bg-black/95 px-8 py-6 text-center shadow-2xl backdrop-blur-md"
        role="status"
      >
        <p className="font-serif text-lg text-[#D4AF37]">편지가 안전하게 연결되었습니다</p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-white/55">
          기록이 서버에 보관되었어요. 이어서 구독·결제를 진행하시거나, 기기와 연결하실 때 이어집니다.
        </p>
      </div>
    </div>
  )
}

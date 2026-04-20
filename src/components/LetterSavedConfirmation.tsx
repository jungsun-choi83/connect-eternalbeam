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
          방금 남긴 마음이 사라지지 않도록 이어졌어요. 이제 다시 만나는 시간을 계속 이어가세요.
        </p>
      </div>
    </div>
  )
}

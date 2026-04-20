type Props = {
  onClick?: () => void
}

export function StickyMobileCta({ onClick }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      <div
        className="border-t border-[#D4AF37]/15 bg-black/90 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onClick}
          className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 py-4 font-serif text-lg tracking-wide text-[#D4AF37] shadow-[0_-12px_48px_rgba(212,175,55,0.12)] transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
        >
          지금, 다시 이어가기
        </button>
      </div>
    </div>
  )
}

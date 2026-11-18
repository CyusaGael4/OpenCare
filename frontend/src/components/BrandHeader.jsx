export default function BrandHeader({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/opencare-mark.png"
        alt="OpenCare"
        className={compact ? 'h-10 w-10 object-contain' : 'h-12 w-12 object-contain'}
        draggable="false"
      />
      <img
        src="/opencare-logo.png"
        alt="OpenCare"
        className={compact ? 'h-7 w-auto object-contain' : 'h-10 w-auto object-contain'}
        draggable="false"
      />
    </div>
  );
}

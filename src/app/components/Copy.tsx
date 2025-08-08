type Props = { label?: string; value: string };

export default function Copy({ label = "Copy", value }: Props) {
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-xs rounded-md border px-2 py-1 text-gray-600 hover:text-gray-900 hover:border-gray-400"
    >
      {label}
    </button>
  );
}



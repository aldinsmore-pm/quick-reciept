type Props = {
  children: React.ReactNode;
  color?: "emerald" | "gray" | "amber" | "sky";
};

export default function Badge({ children, color = "emerald" }: Props) {
  const palette: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${palette[color]}`}>
      {children}
    </span>
  );
}



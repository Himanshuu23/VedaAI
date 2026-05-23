import logoUrl from "@/assets/logo.svg";

export function Logo({ size = 32 }: { size?: number }) {
  return <img src={logoUrl} alt="VedaAI" style={{ height: size, width: "auto" }} />;
}

export function Wordmark() {
  return <img src={logoUrl} alt="VedaAI" className="h-9 w-auto" />;
}
import { useState } from "react";
import { User } from "lucide-react";

interface PlayerAvatarProps {
  url: string | null;
  name: string | null;
  size?: number;
}

export function PlayerAvatar({ url, name, size = 36 }: PlayerAvatarProps) {
  const [error, setError] = useState(false);
  const px = `${size}px`;

  if (url && !error) {
    return (
      <img
        src={url}
        alt={name ?? "Player"}
        className="rounded-full object-cover shrink-0"
        style={{ width: px, height: px }}
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-muted flex items-center justify-center shrink-0"
      style={{ width: px, height: px }}
    >
      <User className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

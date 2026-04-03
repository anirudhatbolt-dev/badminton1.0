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
  const initial = name?.charAt(0)?.toUpperCase();
  return (
    <div
      className="rounded-full bg-muted flex items-center justify-center shrink-0"
      style={{ width: px, height: px }}
    >
      {initial ? (
        <span className="font-semibold text-muted-foreground" style={{ fontSize: `${size * 0.4}px` }}>
          {initial}
        </span>
      ) : (
        <User className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
  );
}

import React, { useState } from "react";

function AlbumCard({ album, onSelect }) {
  const firstPhoto = album.photos?.[0];
  const productLink = firstPhoto?.link || album.link;

  const price = album.price ?? firstPhoto?.price ?? null;
  const description = album.description ?? firstPhoto?.description ?? null;
  const [expanded, setExpanded] = useState(false); // 더보기 상태

  const handleClick = () => {
    if (productLink) {
      window.open(productLink, "_blank", "noopener,noreferrer");
    } else {
      onSelect?.(album);
    }
  };

  return (
    <div
      className="group relative flex-shrink-0 w-[272px] bg-white text-left rounded-2xl shadow-lg overflow-hidden"
    >
      <button type="button" onClick={handleClick} className="w-full text-left">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img
            src={album.cover}
            alt={album.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </button>

      <div className="pt-3 px-2 pb-3">
        {/* 이름 */}
        <div className="text-lg font-semibold truncate text-green-800">
          {album.title}
        </div>

        {/* 가격 */}
        {price && (
          <div className="text-sm text-green-600 mt-0.5">{price}</div>
        )}

        {/* ✅ 설명 (더보기/접기) */}
        {description && (
          <div className="text-sm text-black/70 mt-1">
            <span
              className={
                expanded ? "" : "line-clamp-2 transition-all duration-200"
              }
            >
              {description}
            </span>
            {description.length > 50 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="block mt-1 text-xs text-green-700 hover:underline"
              >
                {expanded ? "접기 ▲" : "더 보기 ▼"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlbumCard;

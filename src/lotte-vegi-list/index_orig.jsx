import React from "react";
import { createRoot } from "react-dom/client";
import { Star, PlusCircle } from "lucide-react";
import { useWidgetProps } from "../use-widget-props";
import markersData from "./markers.json";

function App() {
  // MCP에서 받은 props (sortBy, order)
  const props = useWidgetProps() || {};
  const sortBy = props.sortBy || "rating";
  const order = props.order || "asc";

  // 정렬된 리스트 생성
  const places = React.useMemo(() => {
    const list = Array.isArray(markersData?.places) ? markersData.places : [];
    const sorted = [...list];
    sorted.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [sortBy, order]);

  if (!places.length) {
    return (
      <div className="p-4 text-gray-500 bg-white rounded-2xl border border-black/10">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="max-w-full">
        <div className="flex flex-row items-center gap-4 border-b border-black/5 py-4">
          <div
            className="w-16 aspect-square rounded-xl bg-cover bg-center ring ring-black/5"
            style={{
              backgroundImage:
                "url(https://persistent.oaistatic.com/pizzaz/title.png)",
            }}
          ></div>
          <div>
            <div className="text-base sm:text-xl font-medium">
              Lotte Fresh Vegetables
            </div>
            <div className="text-sm text-black/60">
              Sorted by {sortBy} ({order})
            </div>
          </div>
          <div className="flex-auto hidden sm:flex justify-end pr-2">
            <button
              type="button"
              className="cursor-pointer inline-flex items-center rounded-full bg-[#22C55E] text-white px-4 py-1.5 sm:text-md text-sm font-medium hover:opacity-90 active:opacity-100"
            >
              Save List
            </button>
          </div>
        </div>

        {/* 리스트 */}
        <div className="min-w-full text-sm flex flex-col">
          {places.map((item, i) => (
            <div
              key={item.id || i}
              className="px-3 -mx-2 rounded-2xl hover:bg-green-50 transition-colors"
            >
              <div
                style={{
                  borderBottom:
                    i === places.length - 1
                      ? "none"
                      : "1px solid rgba(0,0,0,0.05)",
                }}
                className="flex w-full items-center gap-2"
              >
                {/* 왼쪽 썸네일 */}
                <div className="py-3 pr-3 min-w-0 w-full sm:w-3/5 flex items-center gap-3">
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg object-cover ring ring-black/5"
                  />
                  <div className="w-3 text-end sm:block hidden text-sm text-black/40">
                    {i + 1}
                  </div>
                  {/* 채소 정보 */}
                  <div className="min-w-0 sm:pl-1 flex flex-col items-start h-full">
                    <div className="font-medium text-sm sm:text-md truncate max-w-[40ch]">
                      {item.name}
                    </div>
                    <div className="mt-1 sm:mt-0.25 flex items-center gap-3 text-black/70 text-sm">
                      <div className="flex items-center gap-1">
                        <Star
                          strokeWidth={1.5}
                          className="h-3 w-3 text-green-600"
                        />
                        <span>
                          {item.rating?.toFixed
                            ? item.rating.toFixed(1)
                            : item.rating}
                        </span>
                      </div>
                      <div className="whitespace-nowrap sm:hidden">
                        ₩{item.price?.toLocaleString?.() || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 우측: 가격 / 버튼 */}
                <div className="hidden sm:block text-end py-2 px-3 text-sm text-black/60 whitespace-nowrap flex-auto">
                  ₩{item.price?.toLocaleString?.() || "—"}
                </div>
                <div className="py-2 whitespace-nowrap flex justify-end">
                  <PlusCircle
                    strokeWidth={1.5}
                    className="h-5 w-5 text-green-700"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* 데이터 없음 */}
          {places.length === 0 && (
            <div className="py-6 text-center text-black/60">
              No vegetables found.
            </div>
          )}
        </div>

        {/* 모바일 Save 버튼 */}
        <div className="sm:hidden px-0 pt-2 pb-2">
          <button
            type="button"
            className="w-full cursor-pointer inline-flex items-center justify-center rounded-full bg-[#22C55E] text-white px-4 py-2 font-medium hover:opacity-90 active:opacity-100"
          >
            Save List
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("lotte-vegi-list-root")).render(<App />);

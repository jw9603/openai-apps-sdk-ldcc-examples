import React from "react";
import { createRoot } from "react-dom/client";
import { Star } from "lucide-react";
import { useWidgetProps } from "../use-widget-props";
import markersData from "./markers.json";

/* ---------- helpers ---------- */
function formatPrice(krwPerKg) {
  if (typeof krwPerKg !== "number") return "—";
  return `₩${krwPerKg.toLocaleString("ko-KR")} / kg`;
}
function sortLabel(sortBy, order) {
  const by = { rating: "rating", priceKrwPerKg: "price" }[sortBy] || sortBy;
  const ord = order === "desc" ? "desc" : "asc";
  return `Sorted by ${by} (${ord})`;
}

/* ---------- app ---------- */
function App() {
  const props = useWidgetProps() || {};
  const sortBy = props.sortBy || "rating";
  const order = props.order || "desc";

  // 선택 상태(localStorage 복원)
  const [picked, setPicked] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("lotte_picked_ids") || "[]")); }
    catch { return new Set(); }
  });
  const [showOnlyPicked, setShowOnlyPicked] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("lotte_show_only_picked") || "false"); }
    catch { return false; }
  });
  const [menuOpen, setMenuOpen] = React.useState(false);

  // 정렬
  const sorted = React.useMemo(() => {
    const list = Array.isArray(markersData?.places) ? markersData.places : [];
    const arr = [...list];
    arr.sort((a, b) => {
      const A = a?.[sortBy];
      const B = b?.[sortBy];
      if (A < B) return order === "asc" ? -1 : 1;
      if (A > B) return order === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [sortBy, order]);

  // 필터(선택만 보기)
  const places = React.useMemo(
    () => (showOnlyPicked ? sorted.filter(p => picked.has(p.id)) : sorted),
    [sorted, showOnlyPicked, picked]
  );

  const selectedRows = React.useMemo(
    () => sorted.filter(p => picked.has(p.id)),
    [sorted, picked]
  );

  const togglePick = (id) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
    localStorage.setItem("lotte_picked_ids", JSON.stringify([...next]));
  };

  const toggleShowOnlyPicked = () => {
    const v = !showOnlyPicked;
    setShowOnlyPicked(v);
    localStorage.setItem("lotte_show_only_picked", JSON.stringify(v));
    setMenuOpen(false);
  };

  const openLink = (link) => {
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };
  
  React.useEffect(() => {
  if (showOnlyPicked && picked.size === 0) {
    setShowOnlyPicked(false);
    localStorage.setItem("lotte_show_only_picked", "false");
  }
  }, [picked, showOnlyPicked]);


  // ✅ 안정적인 링크 복사 (Clipboard → 실패 시 textarea 폴백)
  const copyLinks = async () => {
    const txt = selectedRows.map(r => r.link).filter(Boolean).join("\n");
    if (!txt) { alert("선택된 항목에 링크가 없습니다."); return; }

    try {
      await navigator.clipboard.writeText(txt);        // HTTPS + 사용자 제스처 필요
      alert("선택한 링크를 복사했어요.");
    } catch {
      // 폴백: textarea 생성해서 선택-복사
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand("copy");
        alert(ok ? "선택한 링크를 복사했어요." : "복사에 실패했어요. 수동으로 복사해주세요.");
      } finally {
        ta.remove();
      }
    }
    setMenuOpen(false);
  };

  // 여러 탭 열기: 1) 즉시 시도 → 2) 일부 차단 시 앵커+지연 → 3) 전부 차단 시 링크 복사 폴백
const openAll = async () => {
  if (!selectedRows.length) { alert("선택된 항목이 없습니다."); return; }

  // 1) 사용자 제스처 안에서 즉시 window.open 시도 (가장 허용률 높음)
  let opened = 0;
  const toOpenLater = [];
  for (const r of selectedRows) {
    if (!r.link) continue;
    const win = window.open(r.link, "_blank", "noopener,noreferrer");
    if (win) opened++;
    else toOpenLater.push(r.link); // 차단된 것들
  }

  // 메뉴 닫기 (제스처 컨텍스트 유지에 방해 없도록 맨 나중으로 미뤄도 OK)
  setMenuOpen(false);

  // 2) 일부만 열렸다면: a.click() + 지연으로 재시도
  if (toOpenLater.length && opened > 0) {
    toOpenLater.forEach((href, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 150);
    });
    return;
  }

  // 3) 전부 차단됐다면: 링크 복사 폴백 안내
  if (opened === 0) {
    const txt = selectedRows.map(r => r.link).filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(txt);
      alert("브라우저 팝업 차단으로 새 탭을 열 수 없었어요.\n링크를 클립보드에 복사해 두었습니다. 팝업 허용 후 붙여넣어 열어주세요.");
    } catch {
      // 최후 폴백: textarea 복사
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("브라우저 팝업 차단으로 새 탭을 열 수 없었어요.\n링크를 클립보드에 복사해 두었습니다.");
    }
  }
};


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
        <div className="flex flex-row items-center gap-4 border-b border-black/5 py-4 relative">
          <img
            src="/static/logo.png"
            alt="Lotte Vegetables"
            className="w-16 h-16 rounded-xl object-cover ring ring-black/5"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            loading="lazy"
          />
          <div className="flex-1">
            <div className="text-base sm:text-xl font-medium">Lotte Fresh Vegetables</div>
            <div className="text-sm text-black/60">{sortLabel(sortBy, order)}</div>
          </div>

          {/* 찜 / 메뉴 */}
          <div className="relative">
            <button
              type="button"
              className="cursor-pointer inline-flex items-center rounded-full bg-[#22C55E] text-white px-4 py-1.5 sm:text-md text-sm font-medium hover:opacity-90 active:opacity-100"
              onClick={() => setMenuOpen(v => !v)}   // 사용자 제스처 유지
              aria-expanded={menuOpen}
              aria-haspopup="true"
              title="선택 항목 액션"
            >
              찜 {picked.size}
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl border border-black/10 bg-white shadow-lg z-20"
                role="menu"
              >
                <button
                  className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-t-xl"
                  onClick={toggleShowOnlyPicked}
                  role="menuitem"
                >
                  {showOnlyPicked ? "선택 해제 포함하여 보기" : "선택한 항목만 보기"}
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-green-50"
                  onClick={copyLinks}
                  role="menuitem"
                >
                  선택 링크 복사
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 리스트 */}
        <div className="min-w-full text-sm flex flex-col">
          {places.map((item, i) => {
            const isLowerRated = typeof item.rating === "number" && item.rating < 4.3;
            const checked = picked.has(item.id);

            return (
              <div
                key={item.id || i}
                className={`px-3 -mx-2 rounded-2xl hover:bg-green-50 transition-colors cursor-pointer ${
                  isLowerRated ? "opacity-90" : ""
                }`}
                onClick={() => item.link && openLink(item.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLink(item.link);
                  }
                }}
              >
                <div
                  style={{
                    borderBottom:
                      i === places.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                  }}
                  className="flex w-full items-stretch gap-2"
                >
                  {/* 왼쪽: 체크박스 */}
                  <div className="flex items-center pl-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-green-600"
                      checked={checked}
                      onChange={(e) => {
                        e.stopPropagation();
                        togglePick(item.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${item.name} 선택`}
                    />
                  </div>

                  {/* 썸네일 + 정보 */}
                  <div className="py-3 pr-3 min-w-0 w-full flex items-center gap-3">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg object-cover ring ring-black/5"
                      loading="lazy"
                    />
                    <div className="w-3 text-end sm:block hidden text-sm text-black/40">
                      {i + 1}
                    </div>

                    {/* 텍스트 블록 */}
                    <div className="min-w-0 sm:pl-1 flex flex-col items-start h-full">
                      {/* 이름 */}
                      <div
                        className={`font-medium text-sm sm:text-md truncate max-w-[40ch] ${
                          isLowerRated ? "text-gray-700" : "text-green-800"
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </div>

                      {/* 평점 + (모바일 가격) */}
                      <div className="mt-1 flex items-center gap-3 text-black/70 text-sm">
                        <div className="flex items-center gap-1">
                          <Star
                            strokeWidth={1.5}
                            className={`h-3 w-3 ${isLowerRated ? "text-gray-400" : "text-green-600"}`}
                            aria-hidden="true"
                          />
                          <span>{item.rating?.toFixed ? item.rating.toFixed(1) : item.rating}</span>
                        </div>
                        <div className="whitespace-nowrap sm:hidden">
                          {formatPrice(item.priceKrwPerKg)}
                        </div>
                      </div>

                      {/* 설명 */}
                      {item.description && (
                        <div className="mt-0.5 text-xs sm:text-sm text-black/60 line-clamp-2 max-w-[46ch]">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 우측: 데스크톱 가격 */}
                  <div className="hidden sm:flex items-center justify-end py-2 px-3 text-sm text-black/60 whitespace-nowrap flex-auto">
                    {formatPrice(item.priceKrwPerKg)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("lotte-vegi-list-root")).render(<App />);
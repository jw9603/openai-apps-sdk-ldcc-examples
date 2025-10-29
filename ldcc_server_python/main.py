"""Lotte MCP Server — 확장 가능한 Tool 핸들러 기반 Python 서버 예제"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import os
from fastapi import FastAPI, Response
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

import mcp.types as types
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from abc import ABC, abstractmethod

# ---------------------------------------------------------------------
# 공통 설정
# ---------------------------------------------------------------------

@dataclass(frozen=True)
class LotteWidget:
    identifier: str
    title: str
    template_uri: str
    invoking: str
    invoked: str
    html: str
    response_text: str


ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


@lru_cache(maxsize=None)
def _load_widget_html(component_name: str) -> str:
    html_path = ASSETS_DIR / f"{component_name}.html"
    if html_path.exists():
        return html_path.read_text(encoding="utf8")

    fallback_candidates = sorted(ASSETS_DIR.glob(f"{component_name}-*.html"))
    if fallback_candidates:
        return fallback_candidates[-1].read_text(encoding="utf8")

    raise FileNotFoundError(
        f'Widget HTML for "{component_name}" not found in {ASSETS_DIR}. '
        "Run `pnpm run build` to generate the assets before starting the server."
    )


# ---------------------------------------------------------------------
# 위젯 정의
# ---------------------------------------------------------------------
widgets: List[LotteWidget] = [
    LotteWidget(
        # 내부용: 짧고 안전한 영문 슬러그
        identifier="롯데 판매 채소 모음",

        # 모델이 프롬프트에서 인식할 수 있는 키워드들은 여기에
        title="롯데 판매 채소 모음 | 채소 앨범 | 상추 | 양상추 | 로메인 | 버터헤드 | 프릴아이스 | 바타비아 | Lotte Vegetables Album | 상추 품종 종류 | 품종",

        # 템플릿 경로 (UI 파일)
        template_uri="ui://widget/lotte-vegi-albums.html",

        # 모델이 '이걸 호출해야겠다'고 판단하게 하는 문맥
        invoking="Search and show vegetable albums such as romaine, butterhead, frillice, batavia from Lotte store.",

        # 호출 후 자연스러운 대화 연결용 문장
        invoked="Displayed Lotte vegetable album successfully.",

        # 렌더링할 HTML 파일
        html=_load_widget_html("lotte-vegi-albums"),

        # 사용자에게 보이는 피드백
        response_text="롯데에서 판매 중인 채소 모음이 아래에 표시됩니다. 확인해보세요 🥬",
    ),

    LotteWidget(
        identifier= "롯데 판매 채소 리스트 정렬",
        title="롯데 채소 리스트 | 채소 정렬 | 상추 가격 비교 | Lotte Vegetable List",
        template_uri="ui://widget/lotte-vegi-list.html",
        invoking="Show sorted vegetable list including lettuce, romaine, butterhead, and batavia from Lotte.",
        invoked="Displayed sorted Lotte vegetable list.",
        html=_load_widget_html("lotte-vegi-list"),
        response_text="롯데에서 판매 중인 채소 리스트를 정렬했어요! 확인해보세요 🥬",
    ),
]


MIME_TYPE = "text/html+skybridge"

WIDGETS_BY_ID: Dict[str, LotteWidget] = {widget.identifier: widget for widget in widgets}
WIDGETS_BY_URI: Dict[str, LotteWidget] = {widget.template_uri: widget for widget in widgets}


# ---------------------------------------------------------------------
# Tool 입력 모델 및 핸들러 기반 구조
# ---------------------------------------------------------------------

class BaseToolInput(BaseModel):
    """모든 Tool Input의 기본 모델"""
    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class BaseToolHandler(ABC):
    """모든 Tool 핸들러의 공통 인터페이스"""

    name: str  # widget.identifier와 일치해야 함
    input_model: type[BaseToolInput]

    @abstractmethod
    def handle(self, payload: BaseToolInput) -> Dict[str, Any]:
        """Tool 호출 시 실행되는 실제 로직"""
        pass


# 개별 Tool 정의 ---------------------------------------------------------

class VegiAlbumInput(BaseToolInput):
    topic: str = Field("채소", alias="topic", description="찾을 상품의 종류")

class VegiAlbumHandler(BaseToolHandler):
    name = "롯데 판매 채소 모음"
    input_model = VegiAlbumInput

    def handle(self, payload: VegiAlbumInput):
        return {"topic": payload.topic}


class VegiListInput(BaseToolInput):
    sort_by: Literal["rating", "price"] = Field("rating", alias="sortBy")
    order: Literal["asc", "desc"] = Field("asc", alias="order")

class VegiListHandler(BaseToolHandler):
    name = "롯데 판매 채소 리스트 정렬"
    input_model = VegiListInput

    def handle(self, payload: VegiListInput):
        return {"sortBy": payload.sort_by, "order": payload.order}


# 등록 --------------------------------------------------------------
TOOL_HANDLERS: Dict[str, BaseToolHandler] = {
    VegiAlbumHandler.name: VegiAlbumHandler(),
    VegiListHandler.name: VegiListHandler(),
}


# ---------------------------------------------------------------------
# MCP 서버 초기화
# ---------------------------------------------------------------------
mcp = FastMCP(
    name="lotte-python",
    stateless_http=True,
)


# Tool input schema 정의
TOOL_INPUT_SCHEMA: Dict[str, Dict[str, Any]] = {
    "롯데 판매 채소 모음": {
        "type": "object",
        "properties": {
            "topic": {
                "type": "string",
                "description": "Product that user is looking for.",
                "default": "채소",
            }
        },
        "additionalProperties": False,
    },
    "롯데 판매 채소 리스트 정렬": {
        "type": "object",
        "properties": {
            "sortBy": {
                "type": "string",
                "enum": ["rating", "price"],
                "description": "Field to sort the list by (e.g., rating, price).",
                "default": "rating",
            },
            "order": {
                "type": "string",
                "enum": ["asc", "desc"],
                "description": "Sort order: ascending or descending.",
                "default": "asc",
            },
        },
        "additionalProperties": False,
    },
}


# ---------------------------------------------------------------------
# 메타 정보 생성 함수
# ---------------------------------------------------------------------

def _resource_description(widget: LotteWidget) -> str:
    return f"{widget.title} widget markup"

def _tool_meta(widget: LotteWidget) -> Dict[str, Any]:
    return {
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }

def _embedded_widget_resource(widget: LotteWidget) -> types.EmbeddedResource:
    return types.EmbeddedResource(
        type="resource",
        resource=types.TextResourceContents(
            uri=widget.template_uri,
            mimeType=MIME_TYPE,
            text=widget.html,
            title=widget.title,
        ),
    )


# ---------------------------------------------------------------------
# MCP 요청 핸들러
# ---------------------------------------------------------------------

@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    """각 Tool을 MCP로 노출"""
    return [
        types.Tool(
            name=widget.identifier,
            title=widget.title,
            description=widget.title,
            inputSchema=deepcopy(TOOL_INPUT_SCHEMA[widget.identifier]),
            _meta=_tool_meta(widget),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": True,
            },
        )
        for widget in widgets
    ]


@mcp._mcp_server.list_resources()
async def _list_resources() -> List[types.Resource]:
    return [
        types.Resource(
            name=widget.title,
            title=widget.title,
            uri=widget.template_uri,
            description=_resource_description(widget),
            mimeType=MIME_TYPE,
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


@mcp._mcp_server.list_resource_templates()
async def _list_resource_templates() -> List[types.ResourceTemplate]:
    return [
        types.ResourceTemplate(
            name=widget.title,
            title=widget.title,
            uriTemplate=widget.template_uri,
            description=_resource_description(widget),
            mimeType=MIME_TYPE,
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


async def _handle_read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
    """리소스 읽기"""
    widget = WIDGETS_BY_URI.get(str(req.params.uri))
    if widget is None:
        return types.ServerResult(
            types.ReadResourceResult(contents=[], _meta={"error": f"Unknown resource: {req.params.uri}"})
        )

    contents = [
        types.TextResourceContents(
            uri=widget.template_uri,
            mimeType=MIME_TYPE,
            text=widget.html,
            _meta=_tool_meta(widget),
        )
    ]
    return types.ServerResult(types.ReadResourceResult(contents=contents))


async def _call_tool_request(req: types.CallToolRequest) -> types.ServerResult:
    """Tool 실행 요청 처리"""
    widget = WIDGETS_BY_ID.get(req.params.name)
    handler = TOOL_HANDLERS.get(req.params.name)

    if widget is None or handler is None:
        return types.ServerResult(
            types.CallToolResult(
                content=[types.TextContent(type="text", text=f"Unknown tool: {req.params.name}")],
                isError=True,
            )
        )

    arguments = req.params.arguments or {}

    try:
        payload = handler.input_model.model_validate(arguments)
    except ValidationError as exc:
        return types.ServerResult(
            types.CallToolResult(
                content=[types.TextContent(type="text", text=f"Input validation error: {exc.errors()}")],
                isError=True,
            )
        )

    # 각 Tool별 비즈니스 로직 실행
    structured_content = handler.handle(payload)

    # 공통 메타 정보
    widget_resource = _embedded_widget_resource(widget)
    meta = {
        "openai.com/widget": widget_resource.model_dump(mode="json"),
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }

    return types.ServerResult(
        types.CallToolResult(
            content=[types.TextContent(type="text", text=widget.response_text)],
            structuredContent=structured_content,
            _meta=meta,
        )
    )


# 핸들러 등록
mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
mcp._mcp_server.request_handlers[types.ReadResourceRequest] = _handle_read_resource


# ---------------------------------------------------------------------
# FastAPI 서버 설정
# ---------------------------------------------------------------------

app = mcp.streamable_http_app()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# Static asset (image/css/js) serving
#
# 💻 macOS / Linux 예시:
# app.mount(
#     "/static",
#     StaticFiles(directory="/Users/YourName/openai-apps-sdk-ldcc_examples/images"),
#     name="static"
# )
#
# 🪟 Windows 예시:
# app.mount(
#     "/static",
#     StaticFiles(directory="C:\\Users\\YourName\\openai-apps-sdk-ldcc_examples\\images"),
#     name="static"
# )
#
# 👉 경로는 자신의 OS 환경에 맞게 변경 필요!

app.mount(
    "/static",
    StaticFiles(directory="/Users/jeongjiwon/openai-apps-sdk-ldcc_examples/images"),
    name="static"
)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

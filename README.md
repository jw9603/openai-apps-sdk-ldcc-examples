<!-- # Apps SDK Examples Gallery

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

This repository showcases example UI components to be used with the Apps SDK, as well as example MCP servers that expose a collection of components as tools.
It is meant to be used as a starting point and source of inspiration to build your own apps for ChatGPT.

## MCP + Apps SDK overview

The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools, data, and user interfaces. An MCP server exposes tools that a model can call during a conversation and returns results according to the tool contracts. Those results can include extra metadata—such as inline HTML—that the Apps SDK uses to render rich UI components (widgets) alongside assistant messages.

Within the Apps SDK, MCP keeps the server, model, and UI in sync. By standardizing the wire format, authentication, and metadata, it lets ChatGPT reason about your connector the same way it reasons about built-in tools. A minimal MCP integration for Apps SDK implements three capabilities:

1. **List tools** – Your server advertises the tools it supports, including their JSON Schema input/output contracts and optional annotations (for example, `readOnlyHint`).
2. **Call tools** – When a model selects a tool, it issues a `call_tool` request with arguments that match the user intent. Your server executes the action and returns structured content the model can parse.
3. **Return widgets** – Alongside structured content, return embedded resources in the response metadata so the Apps SDK can render the interface inline in the Apps SDK client (ChatGPT).

Because the protocol is transport agnostic, you can host the server over Server-Sent Events or streaming HTTP—Apps SDK supports both.

The MCP servers in this demo highlight how each tool can light up widgets by combining structured payloads with `_meta.openai/outputTemplate` metadata returned from the MCP servers.

## Repository structure

- `src/` – Source for each widget example.
- `assets/` – Generated HTML, JS, and CSS bundles after running the build step.
- `pizzaz_server_node/` – MCP server implemented with the official TypeScript SDK.
- `pizzaz_server_python/` – Python MCP server that returns the Pizzaz widgets.
- `solar-system_server_python/` – Python MCP server for the 3D solar system widget.
- `build-all.mts` – Vite build orchestrator that produces hashed bundles for every widget entrypoint.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Python 3.10+ (for the Python MCP server)

## Install dependencies

Clone the repository and install the workspace dependencies:

```bash
pnpm install
```

> Using npm or yarn? Install the root dependencies with your preferred client and adjust the commands below accordingly.

## Build the components gallery

The components are bundled into standalone assets that the MCP servers serve as reusable UI resources.

```bash
pnpm run build
```

This command runs `build-all.mts`, producing versioned `.html`, `.js`, and `.css` files inside `assets/`. Each widget is wrapped with the CSS it needs so you can host the bundles directly or ship them with your own server.

To iterate on your components locally, you can also launch the Vite dev server:

```bash
pnpm run dev
```

## Serve the static assets

If you want to preview the generated bundles without the MCP servers, start the static file server after running a build:

```bash
pnpm run serve
```

The assets are exposed at [`http://localhost:4444`](http://localhost:4444) with CORS enabled so that local tooling (including MCP inspectors) can fetch them.

## Run the MCP servers

The repository ships several demo MCP servers that highlight different widget bundles:

- **Pizzaz (Node & Python)** – pizza-inspired collection of tools and components
- **Solar system (Python)** – 3D solar system viewer

Every tool response includes plain text content, structured JSON, and `_meta.openai/outputTemplate` metadata so the Apps SDK can hydrate the matching widget.

### Pizzaz Node server

```bash
cd pizzaz_server_node
pnpm start
```

### Pizzaz Python server

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r pizzaz_server_python/requirements.txt
uvicorn ldcc_server_python.main:app --port 8000
```

### Solar system Python server

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r solar-system_server_python/requirements.txt
uvicorn solar-system_server_python.main:app --port 8000
```

You can reuse the same virtual environment for all Python servers—install the dependencies once and run whichever entry point you need.

## Testing in ChatGPT

To add these apps to ChatGPT, enable [developer mode](https://platform.openai.com/docs/guides/developer-mode), and add your apps in Settings > Connectors.

To add your local server without deploying it, you can use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet.

For example, once your mcp servers are running, you can run:

```bash
ngrok http 8000
```

You will get a public URL that you can use to add your local server to ChatGPT in Settings > Connectors.

For example: `https://<custom_endpoint>.ngrok-free.app/mcp`

Once you add a connector, you can use it in ChatGPT conversations.

You can add your app to the conversation context by selecting it in the "More" options.

![more-chatgpt](https://github.com/user-attachments/assets/26852b36-7f9e-4f48-a515-aebd87173399)

You can then invoke tools by asking something related. For example, for the Pizzaz app, you can ask "What are the best pizzas in town?".

## Next steps

- Customize the widget data: edit the handlers in `pizzaz_server_node/src`, `pizzaz_server_python/main.py`, or the solar system server to fetch data from your systems.
- Create your own components and add them to the gallery: drop new entries into `src/` and they will be picked up automatically by the build script.

### Deploy your MCP server

You can use the cloud environment of your choice to deploy your MCP server.

Include this in the environment variables:

```
BASE_URL=https://your-server.com
```

This will be used to generate the HTML for the widgets so that they can serve static assets from this hosted url.

## Contributing

You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details. -->



# 🍃 도시의 푸른농장 · Lotte Vegi Apps SDK 데모

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

이 저장소는 **OpenAI Apps SDK** 와 **MCP(Model Context Protocol)** 를 사용하여  
ChatGPT 내부에서 **상호작용 가능한 UI 위젯(React UI)** 을 렌더링하는 예시 프로젝트입니다.

OpenAI에서 제공한 기본 데모 **Pizzaz** 앱을 기반으로,
이를 **롯데이노베이트 스마트팜(도시의 푸른농장)** 상품 데이터 UI로 확장하였습니다.

---

## 🧭 MCP + Apps SDK 개요

**MCP (Model Context Protocol)** 은 ChatGPT가 외부 데이터 / API / 도구에 접속할 수 있도록 해주는 표준 프로토콜입니다.  
**Apps SDK** 는 MCP 서버가 반환한 데이터를 기반으로 **React UI 컴포넌트**를 ChatGPT 안에서 직접 그려주는 역할을 합니다.

본 프로젝트에서 MCP 서버는 다음을 수행합니다:

1. **툴 목록 제공** – 사용할 수 있는 기능 목록 및 JSON Schema 정의
2. **툴 실행** – 사용자 요청에 따라 데이터를 조회/가공하여 반환
3. **위젯 반환** – `_meta.openai/outputTemplate` 메타데이터를 포함하여 ChatGPT UI에 렌더링 지시

즉, ChatGPT는 **단순 텍스트 응답 → 인터랙티브 데이터 앱 환경** 으로 확장됩니다.

---

## 📁 저장소 구조

```

src/                     # UI 위젯 (React + Tailwind)
assets/                  # build 결과물 (HTML, JS, CSS)  ← pnpm run build 후 생성됨
ldcc_server_python/       # Python MCP 서버
build-all.mts            # 위젯 빌드 자동화 스크립트 (Vite 기반)

````

---

## ✅ 사전 요구사항

- Node.js 18+
- pnpm
- Python 3.10+

---

## 🔧 의존성 설치

```bash
pnpm install
````

---

## 🎨 UI 위젯 빌드

```bash
pnpm run build
```

UI를 수정하면서 바로 렌더 결과를 확인하고 싶다면, Vite 개발 서버를 실행합니다:

```bash
pnpm run dev
```

이 모드는 핫 리로드를 지원하므로 React UI 변경사항이 실시간으로 반영됩니다. (데모 보여줄 때 쓰기)


이 명령은 `build-all.mts` 를 실행하여 `assets/` 디렉토리에 아래와 같은 빌드 산출물을 생성합니다:

```
assets/
  lotte-vegi-list.html
  lotte-vegi-list.js
  lotte-vegi-list.css
  lotte-vegi-albums.html
  lotte-vegi-albums.js
  lotte-vegi-albums.css
```

> 이 정적 파일들은 **MCP 서버에서 직접 서빙**됩니다.

---

## 🥬 MCP 서버 실행 (Python)

이 저장소는 Apps SDK 위젯 번들을 시각화하기 위한 **Python MCP 서버 예시**를 포함합니다.
모든 도구 응답에는 일반 텍스트, 구조화된 JSON, 그리고
`_meta.openai/outputTemplate` 메타데이터가 포함되어 있어 ChatGPT가 대응되는 위젯을 자동으로 렌더링할 수 있습니다.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r ldcc_server_python/requirements.txt
uvicorn ldcc_server_python.main:app --port 8000
```

> 💡 한 번 설치한 가상환경(.venv)은 모든 Python MCP 서버에서 재사용할 수 있습니다.


### ⚠️ 정적 파일 경로 설정 필수

`main.py` 내:

```python
app.mount(
    "/static",
    StaticFiles(directory="/path/to/project/assets"),  # 운영체제에 따라 수정
    name="static"
)
```

| OS          | 예시 경로                                         |
| ----------- | --------------------------------------------- |
| macOS/Linux | `/Users/username/lotte-vegi-app/assets`       |
| Windows     | `C:\\Users\\username\\lotte-vegi-app\\assets` |

---

## 💬 ChatGPT에서 테스트하기

ChatGPT에서 Apps SDK 기반 앱을 실행하려면
[개발자 모드(Developer Mode)](https://platform.openai.com/docs/guides/developer-mode)를 활성화하고,
**Settings → Connectors** 메뉴에서 앱을 추가해야 합니다.

로컬 서버를 배포하지 않고 연결하려면
[ngrok](https://ngrok.com/) 또는 [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)을 이용해
로컬 서버를 인터넷에 노출시킬 수 있습니다.

예를 들어 MCP 서버가 실행 중이라면:

```bash
ngrok http 8000
```

실행 후, 아래와 같은 공개 URL이 생성됩니다:

```
https://<custom_endpoint>.ngrok-free.app/mcp
```

이 URL을 ChatGPT 설정에 추가합니다:

> **Settings → Developer Mode → Connectors → Add Custom MCP Server**

추가가 완료되면, ChatGPT 대화창에서 앱을 불러올 수 있습니다.
예를 들어 **도시의 푸른농장 앱**이 연결된 상태에서 이렇게 물어볼 수 있습니다:

```
상추를 구매하고 싶은데 상추 품종이 다양하잔아? 상추 품종들을 보여줄래?
```

---

![more-chatgpt](https://github.com/user-attachments/assets/26852b36-7f9e-4f48-a515-aebd87173399)

ChatGPT는 MCP 서버로부터 받은 데이터를 바탕으로
상추 품종, 가격, 설명 등의 정보를 **대화창 내 위젯 형태로 표시**합니다.

---


## 📜 License

이 프로젝트는 **MIT License** 하에 배포됩니다.
자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.

---

## Credits
This project is based on the Pizzaz example from the
[openai/openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples)
repository, which is licensed under the MIT License.


All custom UI and dataset modifications for "도시의 푸른농장" are authored by Jiwon Jeong.








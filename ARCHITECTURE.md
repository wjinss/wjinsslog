# wjinss.log Architecture

이 문서는 `wjinss.log`의 폴더 구조와 기능별 데이터 흐름을 정리한 문서입니다.

README가 프로젝트의 목적과 구현 회고를 설명한다면,  
이 문서는 실제 코드가 어떤 기준으로 나뉘어 있고 데이터가 어떤 순서로 이동하는지 설명합니다.

이 블로그는 단일 작성자의 개발 블로그로 설계했습니다.

공개 사용자는 작성된 글을 읽고,  
로그인한 사용자는 좋아요와 댓글로 상호작용할 수 있습니다.

포스트 작성, 수정, 삭제는 관리자만 가능해야 하기 때문에  
라우트 구조, 서버 액션, Supabase 접근 흐름에서도 권한 확인을 중요하게 다룹니다.

---

## 전체 설계 방향

프로젝트 구조는 크게 다음 기준으로 나누었습니다.

```txt
페이지와 라우팅
→ app

공통 UI
→ components

기능별 도메인 로직
→ features

외부 서비스 클라이언트와 공통 유틸
→ lib, utils
```

Next.js App Router를 사용하기 때문에 페이지 진입점은 `app/`에 둡니다.

하지만 모든 로직을 `app/` 안에 넣으면 페이지가 커지고,  
포스트, 댓글, 인증처럼 기능별로 코드를 찾기 어려워질 수 있습니다.

그래서 실제 기능 구현은 `features/` 아래에 나누었습니다.

기본 데이터 흐름은 다음과 같습니다.

```txt
Page / Route Handler
→ Feature Component
→ Feature Action / Lib
→ Supabase Client
→ Supabase Auth / PostgreSQL / Storage / RPC
```

이 흐름을 유지하면 UI, 기능 로직, 데이터 접근 책임을 비교적 분명하게 분리할 수 있습니다.

---

## 기술 스택

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 기반 UI 컴포넌트
- TanStack Query
- Zustand

### Backend / Database

- Supabase
  - Auth
  - PostgreSQL
  - Storage
  - RPC
  - RLS

### 기타

- Markdown Editor: Toast UI Editor
- Markdown Rendering: react-markdown
- Theme: next-themes
- Deployment: Vercel
- Package Manager: pnpm

---

## 폴더 구조

```txt
src/
├── app/
│   ├── (admin)/
│   │   └── 관리자 전용 페이지
│   │
│   ├── (auth)/
│   │   └── 로그인/회원가입 페이지
│   │
│   ├── (public)/
│   │   └── 공개 페이지
│   │       ├── 메인 페이지
│   │       ├── 포스트 상세
│   │       ├── 검색 페이지
│   │       └── 태그 redirect 페이지
│   │
│   ├── api/
│   │   └── 클라이언트 인터랙션용 API route
│   │
│   ├── auth/
│   │   └── OAuth callback 처리
│   │
│   ├── edit/
│   │   └── 포스트 수정 페이지
│   │
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   │   └── Header, Footer, PageContainer 등
│   │
│   ├── providers/
│   │   └── ThemeProvider, QueryProvider 등
│   │
│   └── ui/
│       └── Button, UserAvatar 등 공통 UI
│
├── constants/
│   ├── routes.ts
│   └── site.ts
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   └── lib/
│   │
│   ├── comments/
│   │   ├── actions/
│   │   ├── components/
│   │   └── lib/
│   │
│   └── posts/
│       ├── actions/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── stores/
│       └── types/
│
├── hooks/
├── lib/
├── styles/
├── types/
└── utils/
```

---

## app 폴더

`app/`는 사용자가 접근하는 URL과 가장 가까운 영역입니다.

페이지, layout, route handler, 일부 server action이 이곳에 있습니다.

### 공개 페이지

공개 페이지는 `src/app/(public)` 아래에 있습니다.

주요 페이지:

- `/`
- `/posts/[slug]`
- `/search`
- `/tags/[tag]`
- `/profile`

메인 페이지는 포스트 목록과 태그 필터를 보여줍니다.

포스트 상세 페이지는 Markdown 본문, 태그, 좋아요, 조회수, 댓글 영역을 함께 조립합니다.

태그 페이지는 별도의 페이지를 새로 만들지 않고 기존 URL 정책을 유지하기 위해 홈으로 redirect합니다.

```txt
/tags/react
→ /?tag=react
```

### 인증 페이지

인증 페이지는 `src/app/(auth)` 아래에 있습니다.

로그인과 회원가입 화면을 담당하고,  
실제 인증 처리는 `features/auth`와 `src/api/auth.ts`의 흐름을 사용합니다.

OAuth callback은 `src/app/auth/callback/route.ts`에서 처리합니다.

### 관리자 페이지

관리자 페이지는 `src/app/(admin)` 아래에 있습니다.

현재는 새 글 작성 페이지가 여기에 있습니다.

관리자 페이지는 UI에서 링크를 숨기는 것만으로 끝내지 않고,  
페이지 진입 시 서버에서 관리자 여부를 다시 확인합니다.

### API Route

`src/app/api`는 브라우저에서 발생하는 인터랙션을 처리합니다.

현재 사용되는 API route:

- `POST /api/posts/[postId]/like`
- `POST /api/posts/[postId]/view`

좋아요와 조회수는 페이지 렌더링 이후 클라이언트에서 요청되는 값이기 때문에  
route handler를 통해 서버 로직으로 연결했습니다.

---

## components 폴더

`components/`는 특정 기능 하나에만 묶이지 않는 공통 컴포넌트를 둡니다.

### layout

`components/layout`에는 화면 전체 구조와 관련된 컴포넌트가 있습니다.

대표적으로 `Header`, `Footer`, `PageContainer`가 있습니다.

`Header`는 서버에서 현재 로그인 상태와 관리자 여부를 확인한 뒤,  
로그인 버튼, 프로필 버튼, 새 글 작성 링크를 조건부로 보여줍니다.

### providers

`components/providers`에는 앱 전체 또는 특정 클라이언트 영역을 감싸는 provider가 있습니다.

- `ThemeProvider`
- `AppQueryProvider`

좋아요처럼 TanStack Query가 필요한 부분은 전체 앱에 무조건 적용하기보다,  
필요한 영역을 `AppQueryProvider`로 감싸는 방식으로 사용합니다.

### ui

`components/ui`는 버튼, 아바타, 이미지 업로드처럼 재사용 가능한 UI 요소를 둡니다.

도메인 기능이 강한 컴포넌트는 이곳에 두지 않고 `features/` 아래에 둡니다.

---

## features 폴더

`features/`는 이 프로젝트에서 가장 중요한 기능 단위 폴더입니다.

처음부터 모든 코드를 공통 컴포넌트로 빼면 오히려 흐름을 이해하기 어려워질 수 있습니다.

그래서 인증, 포스트, 댓글처럼 기능 경계가 분명한 코드는 각 feature 안에 모았습니다.

### auth

`features/auth`는 로그인 상태, 사용자 정보, 관리자 권한 판단을 담당합니다.

주요 흐름:

```txt
getAuthSession()
→ createSupabaseServerClient()
→ supabase.auth.getUser()
→ profiles 조회
→ viewer, adminSession 반환
```

`viewer`는 화면에 보여줄 사용자 정보입니다.

`adminSession`은 관리자 기능 접근을 판단하기 위한 정보입니다.

관리자 기준은 다음 값입니다.

```txt
profiles.role = "admin"
```

이 기준은 Header에서 버튼을 보여줄 때도 사용하고,  
관리자 페이지나 server action에서 실제 권한을 검증할 때도 사용합니다.

### posts

`features/posts`는 포스트와 관련된 대부분의 기능을 담당합니다.

포함되는 기능:

- 포스트 목록
- 포스트 카드
- 태그 필터
- Markdown 작성/수정 폼
- 좋아요 버튼
- 조회수 추적
- 태그 연결
- 검색
- 삭제 action

포스트는 공개 데이터와 사용자별 데이터가 함께 등장합니다.

예를 들어 포스트 제목과 본문은 공개 데이터이지만,  
현재 사용자가 이 글을 좋아요 했는지는 사용자별 데이터입니다.

그래서 포스트 상세 페이지에서는 서버에서 공개 데이터를 먼저 조회하고,  
로그인 사용자가 있으면 좋아요 여부와 관리자 여부를 추가로 확인합니다.

### comments

`features/comments`는 댓글 조회, 댓글 작성, 대댓글 작성을 담당합니다.

댓글은 무한 중첩 구조가 아니라 다음 구조까지만 허용합니다.

```txt
댓글
└ 대댓글
```

개인 블로그에서는 깊은 토론 구조보다 간단한 피드백 흐름이 더 적합하다고 판단했습니다.

그래서 대댓글의 대댓글은 server action에서 막습니다.

---

## lib, constants, utils

### lib

`lib/`에는 여러 기능에서 공유하는 낮은 수준의 코드가 있습니다.

대표적으로 Supabase client 생성 코드가 있습니다.

```txt
src/lib/supabase/server.ts
```

서버 컴포넌트, server action, route handler는 이 함수를 통해 Supabase에 접근합니다.

이렇게 한 곳에서 Supabase client를 만들면 cookie 기반 세션 처리와 환경 변수 확인 로직을 반복하지 않아도 됩니다.

### constants

`constants/`에는 여러 파일에서 함께 쓰는 상수를 둡니다.

- `routes.ts`
- `site.ts`

라우트 경로나 사이트 메타데이터를 한 곳에서 관리하면  
페이지 이동 경로나 SEO 정보를 수정할 때 변경 범위를 줄일 수 있습니다.

### utils

`utils/`에는 날짜 포맷처럼 특정 도메인에 묶이지 않는 유틸리티를 둡니다.

---

## 공개 포스트 조회 흐름

공개 페이지에서 가장 중요한 기준은 삭제되었거나 발행되지 않은 글이 보이면 안 된다는 점입니다.

그래서 공개 포스트 조회는 다음 조건을 기준으로 합니다.

```txt
posts.status = "published"
posts.deleted_at is null
```

이 조건은 한 곳에만 필요한 것이 아닙니다.

적용 영역:

- 메인 포스트 목록
- 포스트 상세
- 태그 필터
- 태그 count
- 검색 결과

메인 페이지의 데이터 흐름은 다음과 같습니다.

```txt
src/app/(public)/page.tsx
→ getPostFeedData({ tag })
→ 공개 태그 목록 조회
→ 선택된 태그가 있으면 해당 post id 조회
→ 공개 포스트 목록 조회
→ 포스트별 태그 이름 조회
→ PostFeed, TagFilterBar 렌더링
```

태그 필터도 공개 포스트 기준을 따라야 합니다.

그렇지 않으면 삭제된 글에만 연결된 태그가 화면에 남거나,  
draft 글 때문에 태그 count가 실제 공개 목록과 맞지 않는 문제가 생길 수 있습니다.

---

## 포스트 상세 데이터 흐름

포스트 상세 페이지는 여러 종류의 데이터를 한 화면에서 조립합니다.

```txt
src/app/(public)/posts/[slug]/page.tsx
→ slug로 포스트 조회
→ 태그 조회
→ 현재 사용자 확인
→ 좋아요 여부 확인
→ 관리자 여부 확인
→ 댓글 조회
→ Markdown 본문 렌더링
```

상세 페이지는 Markdown 본문을 서버에서 렌더링합니다.

좋아요 버튼은 사용자 클릭에 따라 상태가 바뀌기 때문에 클라이언트 컴포넌트로 분리했습니다.

조회수 증가도 페이지 진입 후 브라우저에서 한 번 요청합니다.

이렇게 나눈 이유는 공개 본문 렌더링은 서버에서 안정적으로 처리하고,  
사용자 인터랙션이 필요한 부분만 클라이언트로 보내기 위해서입니다.

---

## 포스트 작성, 수정, 삭제 흐름

포스트 작성, 수정, 삭제는 관리자 기능입니다.

따라서 모든 흐름에서 관리자 여부를 다시 확인합니다.

### 작성

```txt
새 글 작성 페이지
→ getAdminSession()
→ NewPostForm
→ createPostAction()
→ getAdminSession() 재확인
→ 입력값 검증
→ 썸네일 업로드
→ posts 저장
→ tags 저장
→ post_tags 연결
→ 상세 페이지로 이동
```

작성 시 태그는 이름을 정리한 뒤 slug를 만들고,  
`tags`와 `post_tags`를 통해 포스트와 연결합니다.

### 수정

```txt
수정 페이지
→ getAdminSession()
→ EditPostForm
→ updatePostAction()
→ getAdminSession() 재확인
→ posts 업데이트
→ 기존 상세 페이지로 이동
```

수정할 때는 기존 slug를 유지합니다.

글을 수정했다고 URL이 갑자기 바뀌면 기존 링크가 깨질 수 있기 때문입니다.

### 삭제

포스트 삭제는 hard delete가 아니라 soft delete 방식으로 처리합니다.

```txt
DeletePostButton
→ deletePostAction()
→ getAdminSession() 재확인
→ posts.deleted_at 업데이트
→ 관련 path revalidate
→ 홈으로 이동
```

실제 row를 삭제하지 않고 `deleted_at` 값을 기록합니다.

이 방식은 연결된 댓글, 좋아요, 태그 데이터를 보존하면서  
공개 화면에서는 삭제된 글을 숨길 수 있다는 장점이 있습니다.

---

## 검색 흐름

검색은 제목과 태그를 기준으로 동작합니다.

현재 검색 대상:

- 포스트 제목
- 태그명

본문 Markdown까지 검색하지 않는 이유는 검색 결과가 너무 넓어질 수 있기 때문입니다.

Markdown 본문에는 코드 블록, 링크, 예시 문장 등이 포함되므로  
초기 버전에서는 사용자가 글을 찾는 데 직접적인 제목과 태그로 범위를 제한했습니다.

검색 흐름은 다음과 같습니다.

```txt
검색 페이지
→ searchPosts(query)
→ 제목 기준 post id 조회
→ 태그명 기준 post id 조회
→ post id 중복 제거
→ 공개 포스트 조회
→ 태그 이름 연결
→ PostFeed 렌더링
```

검색 결과도 공개 포스트 조건을 반드시 따라야 합니다.

```txt
posts.status = "published"
posts.deleted_at is null
```

---

## 좋아요 흐름

좋아요는 로그인한 사용자만 사용할 수 있습니다.

버튼은 클라이언트에서 즉시 반응해야 하므로 Zustand와 TanStack Query를 사용합니다.

```txt
LikeButton
→ useTogglePostLike()
→ optimistic update
→ POST /api/posts/[postId]/like
→ 현재 사용자 확인
→ set_post_like RPC 호출
→ likesCount, isLiked 반환
→ 클라이언트 상태 확정
```

로그인하지 않은 사용자가 좋아요를 누르면 로그인 페이지로 이동합니다.

좋아요 중복 처리와 count 갱신은 클라이언트만 믿지 않고  
Supabase RPC를 통해 서버 쪽에서 처리합니다.

---

## 조회수 흐름

조회수는 포스트 상세 페이지에 들어온 뒤 클라이언트에서 증가 요청을 보냅니다.

```txt
PostViewTracker
→ 중복 요청 가능 여부 확인
→ POST /api/posts/[postId]/view
→ postId로 slug 확인
→ increment_post_views RPC 호출
→ viewed 상태 기록
```

브라우저에서 같은 포스트에 대해 너무 자주 요청하지 않도록  
`PostViewTracker`가 중복 요청을 줄이는 역할을 합니다.

최종 count 증가는 Supabase RPC에서 처리합니다.

---

## 댓글과 대댓글 흐름

댓글은 읽기는 공개되어 있고, 작성은 로그인 사용자만 가능합니다.

댓글 조회 흐름:

```txt
PostDetailPage
→ getPostComments(postId)
→ 일반 댓글 조회
→ 대댓글 조회
→ profiles에서 작성자 정보 조회
→ 댓글과 replies 연결
→ PostCommentsSection 렌더링
```

댓글 작성 흐름:

```txt
댓글 폼
→ createPostCommentAction()
→ 현재 사용자 확인
→ 대상 포스트 확인
→ comments insert
→ 상세 페이지 revalidate
```

대댓글 작성 흐름:

```txt
대댓글 폼
→ createPostCommentReplyAction()
→ 현재 사용자 확인
→ 부모 댓글 확인
→ 부모 댓글이 대댓글이면 거부
→ comments insert
→ 상세 페이지 revalidate
```

대댓글에 다시 답글을 다는 구조는 허용하지 않습니다.

이 제한 덕분에 댓글 UI와 조회 로직을 단순하게 유지할 수 있습니다.

---

## 인증과 OAuth 흐름

이메일/비밀번호 로그인과 회원가입은 Supabase Auth를 사용합니다.

```txt
로그인/회원가입 폼
→ auth server flow
→ src/api/auth.ts
→ Supabase Auth
```

Google/GitHub OAuth는 환경에 따라 callback origin이 달라질 수 있습니다.

개발환경:

```txt
http://localhost:3000/auth/callback
```

운영환경:

```txt
https://wjinsslog.vercel.app/auth/callback
```

그래서 OAuth 요청 시 현재 origin을 기준으로 callback URL을 만들고,  
callback route에서 Supabase session으로 교환합니다.

```txt
OAuth 버튼
→ signInWithOAuth()
→ Supabase provider
→ /auth/callback
→ exchangeCodeForSession()
→ 원래 이동할 페이지 또는 홈으로 redirect
```

---

## 데이터 모델 관점

애플리케이션 코드에서 주로 다루는 데이터는 다음과 같습니다.

```txt
profiles
└ role, display_name, avatar_url

posts
└ title, slug, excerpt, content_md, thumbnail_url,
  status, published_at, views_count, likes_count,
  comments_count, deleted_at

tags
└ name, slug

post_tags
└ post_id, tag_id

post_likes
└ post_id, user_id

comments
└ post_id, user_id, parent_id, depth, content, deleted_at
```

이 문서는 애플리케이션 구조를 설명하기 위한 문서입니다.

정확한 SQL, RLS, RPC 정의는 Supabase 프로젝트 또는 별도 DB 문서에서 확인하는 것이 좋습니다.

---

## 유지보수 기준

새 기능을 추가할 때는 다음 기준을 우선으로 봅니다.

- 페이지와 라우팅은 `app/`에 둡니다.
- 기능별 UI와 로직은 `features/`에 둡니다.
- 공통 UI만 `components/ui`로 분리합니다.
- Supabase client 생성은 `lib/supabase`를 사용합니다.
- 공개 포스트 조회에는 항상 `published + non-deleted` 조건을 적용합니다.
- 관리자 기능은 UI와 서버에서 모두 권한을 확인합니다.
- 댓글 depth는 2단계까지만 허용합니다.
- 사용자별 데이터는 전역 캐시하지 않습니다.
- 새 라이브러리는 기존 도구로 해결하기 어려울 때만 추가합니다.

코드 변경 후에는 변경 범위에 따라 다음 명령을 확인합니다.

```bash
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm build
```

문서만 수정한 경우에는 빌드가 필수는 아니지만,  
코드 변경이 함께 있다면 TypeScript 검사와 lint를 먼저 확인하는 것이 좋습니다.

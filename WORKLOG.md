# Eternal Connect — 작업 로그

아래에 날짜별로 작업·결정·이슈를 자유롭게 적어 두세요. (커밋 메시지와 별개로, 팀/본인 메모용입니다.)

---

## 자동화 (레포에 올라간 작업)

| 구분 | 내용 |
|------|------|
| **GitHub Actions** | `.github/workflows/ci.yml` — `main` / `master`에 **push** 또는 **PR** 시 `npm ci` → `npm run lint` → `npm run build` |
| **수동 실행** | GitHub 저장소 → **Actions** → **CI** → **Run workflow** (`workflow_dispatch`) |
| **로컬에서 한 번에** | `npm run ci` (lint + build) |

GitHub에 푸시한 뒤 **Actions** 탭에서 성공/실패 로그를 확인하면 됩니다.

---

## 템플릿 (복사해서 사용)

```text
### YYYY-MM-DD

- 한 일:
- 다음 할 일:
- 막힌 점 / 참고 URL:
```

---

## 기록

### YYYY-MM-DD

- 한 일:
- 다음 할 일:
- 메모:

---

(위 `###` 블록을 복사해 날짜만 바꾸고 위에서부터 쌓아도 되고, 최신 항목을 맨 위에 두어도 됩니다.)

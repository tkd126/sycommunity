---
title: Windows에서 Next 개발 서버를 독립 프로세스로 유지하기
date: 2026-07-02
category: workflow-issues
module: local-development
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - Codex 작업 종료 뒤에도 Windows 로컬 개발 서버를 유지해야 할 때
  - 백그라운드 Node 프로세스가 첫 요청 뒤 멈출 때
tags: [windows, nextjs, dev-server, background-process, localhost]
---

# Windows에서 Next 개발 서버를 독립 프로세스로 유지하기

## Context

`localhost:3000`에 앱 대신 연결 거부 화면이 나타났다. 3000 포트에는 리스너가 없었고, 최신 UI는 프로젝트 루트가 아니라 `.worktrees/report-generator-ui`에 있었다. 단순 백그라운드 실행은 부모 셸이 끝날 때 같이 종료되거나, 부모의 출력 핸들을 상속한 프로세스가 첫 요청 뒤 멈추는 문제가 있었다.

## Guidance

올바른 작업 디렉터리에서 Node와 Next 실행 파일을 절대 경로로 지정하고, `UseShellExecute=true`와 숨김 창을 사용하는 독립 프로세스로 실행한다.

```powershell
$psi = [System.Diagnostics.ProcessStartInfo]::new()
$psi.FileName = "<node.exe>"
$psi.Arguments = '"<project>\node_modules\next\dist\bin\next" dev'
$psi.WorkingDirectory = "<project>"
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[System.Diagnostics.Process]::Start($psi)
```

실행 뒤에는 포트가 열렸다는 사실만 확인하지 말고 HTTP 요청을 연속 두 번 보내 두 요청이 모두 200인지 확인한다. 첫 요청만 성공하면 출력 핸들이나 프로세스 수명 문제가 남아 있을 수 있다.

## Why This Matters

포트 리스너만으로는 서버가 실제 요청을 지속해서 처리하는지 알 수 없다. 올바른 작업 폴더와 독립 프로세스 수명, 연속 HTTP 검증을 함께 확인해야 브라우저의 연결 거부와 요청 중단을 구분할 수 있다.

## When to Apply

- Windows에서 자동화 도구가 로컬 Next.js 개발 서버를 백그라운드로 실행할 때
- 셸 명령은 성공했지만 브라우저가 연결을 거부할 때
- 첫 페이지는 열리지만 새로고침이나 두 번째 요청이 멈출 때

## Examples

검증 결과는 다음 두 조건을 모두 만족해야 한다.

- `http://127.0.0.1:3000` 연속 요청 두 번이 모두 상태 코드 200
- 응답 HTML에 앱 제목인 `생기부 도우미`가 포함됨

## Related

- `README_HANDOFF.md`

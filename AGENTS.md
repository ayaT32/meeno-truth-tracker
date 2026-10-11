<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep verification input, claims archive/detail, reports, and analytics as separate authenticated TanStack routes so each staff workflow has a shareable URL.
- Reuse the existing checkClaim server function for AI checks and the user-scoped client for claims, report, and attachment reads/writes so existing access policies remain authoritative.
- Keep client-safe analysis parsing, exports, and aggregates in src/lib/desk.ts and shared result/report controls in components so screens interpret saved research consistently.

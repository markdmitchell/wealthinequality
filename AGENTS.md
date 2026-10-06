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

- Camera framing and screen-space labels must use `getSceneViewportLayout` so visible spheres and labels share identical panel-safe boundaries.
- Journey views must frame the selected sphere with the median-household Earth at exact relative scale; labels identify truly subpixel bodies instead of inflating them.
- The visitor Q&A ("Ask") streams through the /api/ask server route with a system prompt built from wealthSteps data; keep figures sourced from that data so answers match the visualization.
- The log rail's decade ticks keep their true log positions in a column left of the axis, with step names in a column right of it, so a tick is never moved to dodge a label and the two can never collide.
- The phone bottom sheet's measured height is passed to `getSceneViewportLayout` as `bottomInset`; camera framing and callout placement must use it, because the sheet is far taller than any viewport estimate.

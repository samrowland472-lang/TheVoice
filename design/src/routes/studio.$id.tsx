import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StudioApp } from "@/components/studio/studio-app";

export const Route = createFileRoute("/studio/$id")({
  component: StudioPage,
});

function StudioPage() {
  const { id } = Route.useParams();
  return (
    <AppShell>
      <StudioApp id={id} />
    </AppShell>
  );
}

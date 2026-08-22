import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { HubView } from "@/components/hub-view";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <HubView />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#121613",
            border: "1px solid #263029",
            color: "#d9f5e3",
          },
        }}
      />
    </AppShell>
  );
}

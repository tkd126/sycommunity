import { getServerSession } from "next-auth";

import { AppShell } from "@/components/AppShell";
import { AdminApprovalPanel } from "@/components/AdminApprovalPanel";
import { AuthGate } from "@/components/AuthGate";
import { ClubActivityGenerator } from "@/components/ClubActivityGenerator";
import { CreativeActivityGenerator } from "@/components/CreativeActivityGenerator";
import { ReportGenerator } from "@/components/ReportGenerator";
import { authOptions } from "@/lib/auth-options";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const showSettings = session?.user?.role === "admin" && session.user.subscriptionStatus === "active";

  return (
    <AppShell
      showSettings={showSettings}
      club={(
        <AuthGate>
          <ClubActivityGenerator />
        </AuthGate>
      )}
      creative={(
        <AuthGate>
          <CreativeActivityGenerator />
        </AuthGate>
      )}
      settings={(
        <AuthGate>
          <AdminApprovalPanel />
        </AuthGate>
      )}
    >
      <AuthGate>
        <ReportGenerator />
      </AuthGate>
    </AppShell>
  );
}

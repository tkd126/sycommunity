import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminApprovalPanel, mergeAdminUser } from "@/components/AdminApprovalPanel";
import { AppShell } from "@/components/AppShell";

describe("Admin approval UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves the protected flag when merging the PATCH response", () => {
    expect(mergeAdminUser(
      {
        id: "user-1",
        email: "teacher@example.com",
        name: "Teacher",
        subscriptionStatus: "pending",
        protected: false,
        createdAt: "2026-07-08T00:00:00.000Z",
      },
      {
        id: "user-1",
        email: "teacher@example.com",
        name: "Teacher",
        subscriptionStatus: "active",
        createdAt: "2026-07-08T00:00:00.000Z",
      },
    )).toMatchObject({
      subscriptionStatus: "active",
      protected: false,
    });
  });

  it("shows the admin approval screen from the Settings top menu", async () => {
    render(
      <AppShell showSettings settings={<div>관리자 승인 화면</div>}>
        <div>교과평어 작성기</div>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(within(main).getByText("교과평어 작성기")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "설정" }));

    expect(within(main).getByText("관리자 승인 화면")).toBeInTheDocument();
    expect(within(main).queryByText("교과평어 작성기")).not.toBeInTheDocument();
  });

  it("approves a pending teacher through the admin API", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/admin/users") && !init) {
        return new Response(JSON.stringify({
          users: [
            {
              id: "user-1",
              email: "teacher@example.com",
              name: "Teacher",
              subscriptionStatus: "pending",
              protected: false,
              createdAt: "2026-07-08T00:00:00.000Z",
            },
          ],
        }));
      }
      if (url.endsWith("/api/admin/users/user-1") && init?.method === "PATCH") {
        const patch = JSON.parse(String(init.body)) as { subscriptionStatus: "active" | "suspended" };
        return new Response(JSON.stringify({
          user: {
            id: "user-1",
            email: "teacher@example.com",
            name: "Teacher",
            subscriptionStatus: patch.subscriptionStatus,
            createdAt: "2026-07-08T00:00:00.000Z",
          },
        }));
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminApprovalPanel />);

    expect(await screen.findByText("teacher@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "관리자로 변경" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "교사로 변경" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "승인" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/user-1", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ subscriptionStatus: "active" }),
      }));
    });
    expect(await screen.findByText("active")).toBeInTheDocument();

    const approveButton = screen.getByRole("button", { name: "승인" });
    const suspendButton = screen.getByRole("button", { name: "정지" });
    expect(approveButton).toBeDisabled();
    expect(suspendButton).toBeEnabled();

    await userEvent.click(suspendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/user-1", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ subscriptionStatus: "suspended" }),
      }));
    });
    expect(await screen.findByText("suspended")).toBeInTheDocument();
  });

  it("protects the owner account from subscription changes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      users: [
        {
          id: "owner-1",
          email: "owner@example.com",
          name: "Owner",
          subscriptionStatus: "active",
          protected: true,
          createdAt: "2026-07-08T00:00:00.000Z",
        },
      ],
    }))));

    render(<AdminApprovalPanel />);

    const ownerRow = (await screen.findByText("owner@example.com")).closest("tr");
    expect(ownerRow).not.toBeNull();
    expect(within(ownerRow!).getByText("보호 계정")).toBeInTheDocument();
    for (const button of within(ownerRow!).getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});

import { describe, expect, it, vi } from "vitest";

import { handleListAdminUsers } from "@/app/api/admin/users/handler";
import { handleUpdateAdminUser } from "@/app/api/admin/users/[id]/handler";

const adminAccess = vi.fn().mockResolvedValue({
  ok: true,
  userId: "admin-1",
  email: "admin@example.com",
} as const);

describe("admin user APIs", () => {
  it("rejects non-admin users before listing accounts", async () => {
    const response = await handleListAdminUsers({
      requireAdmin: vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        code: "ADMIN_REQUIRED",
        message: "관리자만 이용할 수 있습니다.",
      }),
      listUsers: vi.fn(),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "ADMIN_REQUIRED" });
  });

  it("lists accounts for an admin without exposing provider tokens", async () => {
    const response = await handleListAdminUsers({
      requireAdmin: adminAccess,
      listUsers: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          email: "teacher@example.com",
          name: "Teacher",
          role: "teacher",
          subscriptionStatus: "pending",
          createdAt: new Date("2026-07-08T00:00:00.000Z"),
        },
        {
          id: "admin-1",
          email: "admin@example.com",
          name: "Owner",
          role: "admin",
          subscriptionStatus: "active",
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
        },
      ]),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      users: [
        {
          id: "user-1",
          email: "teacher@example.com",
          name: "Teacher",
          subscriptionStatus: "pending",
          protected: false,
          createdAt: "2026-07-08T00:00:00.000Z",
        },
        {
          id: "admin-1",
          email: "admin@example.com",
          name: "Owner",
          subscriptionStatus: "active",
          protected: true,
          createdAt: "2026-07-07T00:00:00.000Z",
        },
      ],
    });
  });

  it("allows an admin to approve a pending teacher", async () => {
    const updateUser = vi.fn().mockResolvedValue({
      id: "user-1",
      email: "teacher@example.com",
      name: "Teacher",
      role: "teacher",
      subscriptionStatus: "active",
      createdAt: new Date("2026-07-08T00:00:00.000Z"),
    });

    const request = new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ subscriptionStatus: "active" }),
    });

    const response = await handleUpdateAdminUser(request, { params: Promise.resolve({ id: "user-1" }) }, {
      requireAdmin: adminAccess,
      updateUser,
    });

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith("user-1", { subscriptionStatus: "active" });
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        email: "teacher@example.com",
        name: "Teacher",
        subscriptionStatus: "active",
        createdAt: "2026-07-08T00:00:00.000Z",
      },
    });
  });

  it("rejects invalid role updates", async () => {
    const request = new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "owner" }),
    });

    const response = await handleUpdateAdminUser(request, { params: Promise.resolve({ id: "user-1" }) }, {
      requireAdmin: adminAccess,
      updateUser: vi.fn(),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_REQUEST" });
  });

  it("rejects every role mutation even when the role value is valid", async () => {
    const updateUser = vi.fn();
    const response = await handleUpdateAdminUser(
      new Request("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
      }),
      { params: Promise.resolve({ id: "user-1" }) },
      { requireAdmin: adminAccess, updateUser },
    );

    expect(response.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects role mutation when a valid subscription status is also provided", async () => {
    const updateUser = vi.fn();
    const response = await handleUpdateAdminUser(
      new Request("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ subscriptionStatus: "active", role: "admin" }),
      }),
      { params: Promise.resolve({ id: "user-1" }) },
      { requireAdmin: adminAccess, updateUser },
    );

    expect(response.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects changes to the owner account", async () => {
    const updateUser = vi.fn();
    const response = await handleUpdateAdminUser(
      new Request("http://localhost/api/admin/users/admin-1", {
        method: "PATCH",
        body: JSON.stringify({ subscriptionStatus: "suspended" }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
      { requireAdmin: adminAccess, updateUser },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "OWNER_ACCOUNT_PROTECTED" });
    expect(updateUser).not.toHaveBeenCalled();
  });
});

import type { Express } from "express";
import { supabaseAdminClient } from "../db/supabaseAdmin.ts";
import { randomUserKey } from "./requestHelpers.ts";

export const registerUserRoutes = (app: Express) => {
  app.post("/api/users/guest", async (_req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    try {
      const { data, error } = await supabaseAdminClient.rpc("create_guest_app_user");
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as {
        id: string;
        user_key: string;
        guest_number: number;
        username: string;
        full_name: string;
      } | null;
      if (!row?.user_key) {
        return res.status(500).json({ error: "Guest creation returned no row." });
      }
      return res.status(201).json({
        id: row.user_key,
        userKey: row.user_key,
        username: row.username,
        fullName: row.full_name,
        guestNumber: row.guest_number,
        isGuest: true,
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("POST /api/users/guest:", error);
      return res.status(500).json({ error: error?.message || "Failed to create guest user." });
    }
  });

  app.post("/api/users/register", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    const body = req.body ?? {};
    const username = String(body.username || "").trim();
    const fullName = String(body.fullName || "").trim();
    if (!username || !fullName) {
      return res.status(400).json({ error: "username and fullName are required." });
    }
    const userKey = randomUserKey();
    try {
      const { data, error } = await supabaseAdminClient
        .from("app_users")
        .insert({
          user_key: userKey,
          username,
          full_name: fullName,
          is_guest: false,
        })
        .select("user_key, username, full_name, created_at")
        .single();
      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ error: "Username already exists." });
        }
        throw error;
      }
      const row = data as { user_key: string; username: string; full_name: string; created_at: string };
      return res.status(201).json({
        id: row.user_key,
        userKey: row.user_key,
        username: row.username,
        fullName: row.full_name,
        isGuest: false,
        createdAt: new Date(row.created_at).getTime(),
      });
    } catch (error: any) {
      console.error("POST /api/users/register:", error);
      return res.status(500).json({ error: error?.message || "Registration failed." });
    }
  });

  app.post("/api/users/login", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    const username = String((req.body ?? {}).username || "").trim();
    if (!username) {
      return res.status(400).json({ error: "username is required." });
    }
    try {
      const { data, error } = await supabaseAdminClient
        .from("app_users")
        .select("user_key, username, full_name, is_guest, guest_number, created_at")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      const row = data as {
        user_key: string;
        username: string;
        full_name: string;
        is_guest: boolean;
        guest_number: number | null;
        created_at: string;
      } | null;
      if (!row) {
        return res.status(404).json({ error: "User not found." });
      }
      if (row.is_guest) {
        return res.status(400).json({ error: "Guest accounts cannot use username login." });
      }
      return res.json({
        id: row.user_key,
        userKey: row.user_key,
        username: row.username,
        fullName: row.full_name,
        isGuest: false,
        guestNumber: row.guest_number ?? undefined,
        createdAt: new Date(row.created_at).getTime(),
      });
    } catch (error: any) {
      console.error("POST /api/users/login:", error);
      return res.status(500).json({ error: error?.message || "Login failed." });
    }
  });
};

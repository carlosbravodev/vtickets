// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { SupabaseClient, Session } from "@supabase/supabase-js";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
    }
    interface PageData {
      supabase: SupabaseClient | null;
      session: Session | null;
    }
    // interface PageState {}
    // interface Platform {}
  }

  // Lemon Squeezy Overlay
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Setup: (config: { eventHandler: (event: any) => void }) => void;
    };
  }
}

export {};

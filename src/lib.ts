import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabase = Boolean(url && key && !url.includes("YOUR_PROJECT"));
export const supabase: SupabaseClient | null = hasSupabase ? createClient(url!, key!) : null;

export type WeddingContent = {
  welcome: string;
  story: string;
  ceremonyName: string;
  ceremonyAddress: string;
  ceremonyTime: string;
  receptionName: string;
  receptionAddress: string;
  receptionTime: string;
  dressCode: string;
  entourage: string;
  gallery: string[];
  musicUrl: string;
  accent: string;
  template: "classic" | "botanical" | "editorial";
  scheduleNote: string;
};

export const defaultContent: WeddingContent = {
  welcome: "Together with our families, we joyfully invite you to celebrate our wedding.",
  story: "Our story is still being written, and we can't wait to begin this next chapter surrounded by the people we love. Thank you for being part of our journey.",
  ceremonyName: "Ceremony venue to be announced",
  ceremonyAddress: "Add your ceremony address in the admin editor",
  ceremonyTime: "Please check back for the schedule",
  receptionName: "Reception venue to be announced",
  receptionAddress: "Add your reception address in the admin editor",
  receptionTime: "Please check back for the schedule",
  dressCode: "Our wedding palette is baby blue, light blue, beige, white, and soft gold. Please wear your favorite outfit in our requested palette.",
  entourage: "Wedding entourage details will be announced soon.",
  gallery: [],
  musicUrl: "",
  accent: "#9bbfca",
  template: "botanical",
  scheduleNote: "Ceremony, photos, dinner, and dancing — more details to follow."
};

export async function loadContent(): Promise<WeddingContent> {
  if (supabase) {
    const { data } = await supabase.from("site_content").select("content").eq("id", 1).maybeSingle();
    if (data?.content) return { ...defaultContent, ...(data.content as Partial<WeddingContent>) };
  }
  try {
    const saved = localStorage.getItem("rk-wedding-content");
    if (saved) return { ...defaultContent, ...JSON.parse(saved) };
  } catch { /* ignore local storage errors */ }
  return defaultContent;
}

export async function saveContent(content: WeddingContent) {
  if (supabase) {
    const { error } = await supabase.from("site_content").upsert({ id: 1, content, updated_at: new Date().toISOString() });
    if (error) throw error;
  } else {
    localStorage.setItem("rk-wedding-content", JSON.stringify(content));
  }
}

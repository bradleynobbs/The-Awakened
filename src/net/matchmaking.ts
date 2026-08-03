import { getSupabaseClient } from "./supabaseClient";

export interface MatchFound {
  matchId: string;
  opponentId: string;
  /** Whether this client is player1 (acts first) or player2. See DESIGN.md 4.2. */
  isPlayer1: boolean;
}

interface FindMatchRow {
  match_id: string | null;
  opponent_id: string | null;
  is_player1: boolean | null;
}

/**
 * Calls the find_match RPC. Returns a MatchFound if an opponent was
 * already waiting (caller becomes player2), or null if the caller was
 * queued instead (caller should then call waitForMatch to learn when
 * someone else pairs with them, becoming player1).
 */
export async function findMatch(playerId: string): Promise<MatchFound | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("find_match", { p_player_id: playerId }).single<FindMatchRow>();

  if (error) throw new Error(`Matchmaking failed: ${error.message}`);
  if (!data || !data.match_id || !data.opponent_id) return null;

  return { matchId: data.match_id, opponentId: data.opponent_id, isPlayer1: false };
}

/** Removes the caller from the waiting queue (e.g. they cancelled the search). */
export async function leaveQueue(playerId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("leave_queue", { p_player_id: playerId });
  if (error) throw new Error(`Failed to leave queue: ${error.message}`);
}

/**
 * Subscribes to the caller's own queue row so it learns when another
 * player's find_match() call pairs with it. Returns an unsubscribe
 * function. The caller is always player1 in this path (see DESIGN.md 4.2).
 */
export function waitForMatch(
  playerId: string,
  onMatched: (match: MatchFound) => void,
  onError: (message: string) => void,
): () => void {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`queue-watch:${playerId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "queue", filter: `player_id=eq.${playerId}` },
      async (payload) => {
        const row = payload.new as { status: string; match_id: string | null };
        if (row.status !== "matched" || !row.match_id) return;

        const { data, error } = await supabase
          .from("matches")
          .select("player1_id, player2_id")
          .eq("id", row.match_id)
          .single<{ player1_id: string; player2_id: string }>();

        if (error || !data) {
          onError(error?.message ?? "Matched, but could not load match details.");
          return;
        }

        onMatched({ matchId: row.match_id, opponentId: data.player2_id, isPlayer1: true });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

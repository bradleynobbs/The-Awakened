import type { GameEvent, HeroInstanceId, MatchState, PlayerId } from "../engine/types";
import { HERO_DEFINITIONS } from "../engine/heroes";
import { getCardDefinition } from "../engine/cards";

function heroName(state: MatchState, instanceId: HeroInstanceId | undefined): string {
  if (!instanceId) return "";
  for (const player of Object.values(state.players)) {
    const hero = player.heroes.find((h) => h.instanceId === instanceId);
    if (hero) return HERO_DEFINITIONS[hero.heroId].name;
  }
  return instanceId;
}

function fizzledCardName(state: MatchState, playerId: PlayerId, cardInstanceId: string | undefined): string {
  if (!cardInstanceId) return "A card";
  const cardId = state.players[playerId].cardsById[cardInstanceId]?.cardId;
  return cardId ? getCardDefinition(cardId).name : "A card";
}

/** Renders a single engine event as a short, readable combat-log line, from myRole's perspective. */
export function describeEvent(state: MatchState, event: GameEvent, myRole: PlayerId): string | null {
  const e = event as Record<string, unknown>;
  switch (event.type) {
    case "MATCH_STARTED":
      return "The match begins.";
    case "ROUND_STARTED":
      return `Round ${e.roundNumber} — plan your actions.`;
    case "ROUND_RESOLVED":
      return "Fight!";
    case "CARD_PLAYED":
      return `${heroName(state, e.sourceHeroInstanceId as string)} plays ${e.cardName}.`;
    case "DAMAGE_DEALT": {
      const amount = e.amount as number;
      if (amount <= 0) return null;
      const bonus = (e.firePassiveBonus as number) > 0 ? " (+1 Burn bonus)" : "";
      return `${heroName(state, e.targetId as string)} takes ${amount} damage${bonus}.`;
    }
    case "SHIELD_ABSORBED":
      return `${heroName(state, e.targetId as string)}'s Shield absorbs ${e.amount} damage.`;
    case "HEAL_APPLIED":
      return `${heroName(state, e.targetId as string)} is healed for ${e.amount}.`;
    case "SHIELD_GAINED":
      return `${heroName(state, e.targetId as string)} gains ${e.amount} Shield.`;
    case "STATUS_APPLIED":
      return `${heroName(state, e.targetId as string)} is now ${e.status === "burn" ? "Burning" : "Wet"}.`;
    case "STATUS_REMOVED":
      if (!e.targetId) return null;
      return `${heroName(state, e.targetId as string)} is no longer ${e.status === "burn" ? "Burning" : "Wet"}.`;
    case "STATUS_TRIGGERED":
      return `${heroName(state, e.targetId as string)} takes ${e.amount} Burn damage.`;
    case "HERO_DEFEATED":
      return `${heroName(state, e.heroInstanceId as string)} has been defeated!`;
    case "TEAM_UP_TRIGGERED":
      return `Team-Up! ${e.teamUpName}.`;
    case "ACTION_FIZZLED": {
      const who = e.playerId === myRole ? "Your" : "Your opponent's";
      const name = e.kind === "teamup" ? String(e.teamUpName ?? "Team-Up") : fizzledCardName(state, e.playerId as PlayerId, e.cardInstanceId as string | undefined);
      const reason =
        e.reason === "source-defeated"
          ? "its hero was defeated first"
          : e.reason === "secondary-target-defeated"
            ? "its second target was already defeated"
            : "its target was already defeated";
      return `${who} ${name} fizzles — ${reason}.`;
    }
    case "MATCH_ENDED":
      return e.winnerId === myRole ? "You win the match!" : "You lose the match.";
    default:
      return null;
  }
}

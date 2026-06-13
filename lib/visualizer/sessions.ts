import { randomId } from "./defaults";
import type { CreateSessionInput, TrajectoryData, VisualizerSession } from "./types";
import {
  addSegment,
  buildTrajectoryFromInput,
  decodeTrajectoryPayload,
  parsePp,
} from "./pathBuilder";

const globalStore = globalThis as typeof globalThis & {
  __ftcVisualizerSessions?: Map<string, VisualizerSession>;
};

function getStore() {
  if (!globalStore.__ftcVisualizerSessions) {
    globalStore.__ftcVisualizerSessions = new Map();
  }
  return globalStore.__ftcVisualizerSessions;
}

export function createSession(
  input: CreateSessionInput = {},
  name?: string
): VisualizerSession {
  const id = randomId("viz");
  const now = new Date().toISOString();
  const data = buildTrajectoryFromInput(input);
  const session: VisualizerSession = {
    id,
    name: name ?? input.name ?? "Untitled Path",
    createdAt: now,
    updatedAt: now,
    data,
  };
  getStore().set(id, session);
  return session;
}

export function getSession(id: string): VisualizerSession | undefined {
  return getStore().get(id);
}

export function updateSession(
  id: string,
  updater: (session: VisualizerSession) => VisualizerSession
): VisualizerSession | undefined {
  const existing = getStore().get(id);
  if (!existing) return undefined;
  const updated = updater({
    ...existing,
    updatedAt: new Date().toISOString(),
  });
  getStore().set(id, updated);
  return updated;
}

export function deleteSession(id: string): boolean {
  return getStore().delete(id);
}

export function listSessions(): VisualizerSession[] {
  return Array.from(getStore().values()).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function importSessionFromPp(
  ppJson: string,
  name?: string
): VisualizerSession {
  const data = parsePp(ppJson);
  const id = randomId("viz");
  const now = new Date().toISOString();
  const session: VisualizerSession = {
    id,
    name: name ?? "Imported Path",
    createdAt: now,
    updatedAt: now,
    data,
  };
  getStore().set(id, session);
  return session;
}

export function importSessionFromPayload(
  encoded: string,
  name?: string
): VisualizerSession {
  const data = decodeTrajectoryPayload(encoded);
  const id = randomId("viz");
  const now = new Date().toISOString();
  const session: VisualizerSession = {
    id,
    name: name ?? "Shared Path",
    createdAt: now,
    updatedAt: now,
    data,
  };
  getStore().set(id, session);
  return session;
}

export function replaceSessionData(
  id: string,
  data: TrajectoryData
): VisualizerSession | undefined {
  return updateSession(id, (s) => ({ ...s, data }));
}

export { addSegment };

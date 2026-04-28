import type { AgentConfig } from "../../types/agent-routing";

type UpdateConfig = <K extends keyof AgentConfig>(
  field: K,
  value: AgentConfig[K],
) => void;

export function addSkill(
  skills: string[] | undefined,
  newSkill: string,
  updateConfig: UpdateConfig,
  setNewSkill: (value: string) => void,
): void {
  if (!newSkill.trim()) return;
  updateConfig("skills", [...(skills || []), newSkill.trim()]);
  setNewSkill("");
}

export function removeSkill(
  skills: string[] | undefined,
  index: number,
  updateConfig: UpdateConfig,
): void {
  const newSkills = [...(skills || [])];
  newSkills.splice(index, 1);
  updateConfig("skills", newSkills);
}

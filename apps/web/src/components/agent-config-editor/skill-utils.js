export function addSkill(skills, newSkill, updateConfig, setNewSkill) {
  if (!newSkill.trim()) return;
  updateConfig("skills", [...(skills || []), newSkill.trim()]);
  setNewSkill("");
}
export function removeSkill(skills, index, updateConfig) {
  const newSkills = [...(skills || [])];
  newSkills.splice(index, 1);
  updateConfig("skills", newSkills);
}

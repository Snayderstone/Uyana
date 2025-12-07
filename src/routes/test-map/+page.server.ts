import { ProjectService } from '$lib/services/project.service';

export const load = async () => {
  const data = await ProjectService.getProjectsForMap();
  return { data };
};

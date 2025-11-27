import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Aggregates metrics for the Project Team dashboard.
 * - Phase Completion (Claimed vs Required Materials)
 * - Emergency Claim Ratio
 * - Active Projects overview
 */
export const useProjectMetrics = (userId?: string) => {
  return useQuery({
    queryKey: ['project-metrics', userId],
    queryFn: async () => {
      // 1. Fetch projects assigned to user (or all if no userId filter, though typically we filter)
      // Note: api.projects.getAll accepts userId to filter.
      const projects = await api.projects.getAll('active', userId);
      
      // 2. Fetch stats which likely contain material usage data
      // We need to aggregate material usage per phase.
      // Since we don't have a direct "getAllMaterials" for all projects at once, 
      // we might need to fetch materials for the active projects or rely on `useProjectStats` logic if available.
      // For this prototype, we will fetch stats for the first few active projects to visualize.
      // *Optimization*: In a real app, we'd have a backend view for this aggregation.
      // Here, we will iterate the top 5 active projects.
      
      const projectIds = projects.map(p => p.id);
      const materialsPromises = projectIds.slice(0, 5).map(id => api.projects.getMaterials(id));
      const allMaterials = await Promise.all(materialsPromises);
      
      // Flatten materials
      const materials = allMaterials.flat();

      // Aggregate by Phase
      const phaseStats = {
        'P1': { required: 0, claimed: 0 },
        'P2a': { required: 0, claimed: 0 },
        'P2b': { required: 0, claimed: 0 },
      };

      materials.forEach(m => {
        const phase = m.phase as keyof typeof phaseStats;
        if (phaseStats[phase]) {
            phaseStats[phase].required += m.required_quantity;
            phaseStats[phase].claimed += m.claimed_quantity;
        }
      });

      // 3. Fetch Claims for Emergency Ratio
      // We need claims linked to these projects
      const claimsPromises = projectIds.slice(0, 5).map(id => api.claims.getAll({ projectId: id }));
      const projectClaimsGroups = await Promise.all(claimsPromises);
      const allClaims = projectClaimsGroups.flat();

      const emergencyCount = allClaims.filter(c => c.claim_type === 'emergency').length;
      const standardCount = allClaims.filter(c => c.claim_type === 'standard').length;

      return {
        activeProjectsCount: projects.length,
        phaseStats,
        claimRatio: { emergency: emergencyCount, standard: standardCount },
        recentClaims: allClaims.slice(0, 5) // Latest 5 for a list view if needed
      };
    }
  });
};


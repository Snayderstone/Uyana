import { json } from '@sveltejs/kit';
import { ParticipantsDashboardRepository } from '$lib/db/admin/participants/dashboardParticipants.repository';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';

export async function GET() {
  // 1. Obtener configuraciones públicas
  const publicCharts = await AdminChartsRepository.getPublicChartConfigs();
  
  // 2. Obtener datos (misma función del dashboard)
  const dashboardData = await ParticipantsDashboardRepository.getDashboardDataComplete();
  
  if (!dashboardData) {
    return json({ success: false, error: 'No data' }, { status: 500 });
  }
  
  return json({
    success: true,
    data: dashboardData,
    publicCharts: publicCharts.map(c => c.nombre_grafico)
  });
}
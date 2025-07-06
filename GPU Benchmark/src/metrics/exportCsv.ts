import type { Metrics } from '../types';

export function exportCsv(metrics: Metrics[]) {
  if (metrics.length === 0) {
    alert('No data to export. Run the benchmark first.');
    return;
  }
  
  // CSV headers
  const headers = [
    'frame',
    'timestamp', 
    'api',
    'scene',
    'fps',
    'cpu_ms',
    'gpu_ms',
    'vram_mb',
    'draw_calls',
    'triangles'
  ];
  
  // Convert metrics to CSV rows
  const rows = metrics.map(m => [
    m.frame,
    m.timestamp,
    m.api,
    m.scene,
    m.fps.toFixed(2),
    m.cpu_ms.toFixed(2),
    m.gpu_ms !== null ? m.gpu_ms.toFixed(2) : 'N/A',
    m.vram_mb,
    m.draw_calls || 0,
    m.triangles || 0
  ]);
  
  // Build CSV content
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `gpu-benchmark-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`Exported ${metrics.length} data points to CSV`);
}
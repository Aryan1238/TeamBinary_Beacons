import type { InvestigationRecord, AnomalyAlert, SensorType } from '../types/dashboard.types';

export const investigationToAlert = (inv: InvestigationRecord): AnomalyAlert => {
  const variable = (inv.affected_variable || 'temperature').toLowerCase();
  const sensorType: SensorType = 
    variable.includes('temp') ? 'temperature' :
    variable.includes('hum') ? 'humidity' :
    variable.includes('press') ? 'pressure' :
    variable.includes('wind') ? 'wind' : 'temperature';

  const faultLabel = inv.fault_type_if_known && inv.fault_type_if_known !== 'NORMAL'
    ? inv.fault_type_if_known.replace(/_/g, ' ')
    : 'Anomaly';

  const title = `${faultLabel} on ${inv.affected_variable}`;

  const unit = inv.physical_range_check?.unit || (sensorType === 'temperature' ? '°C' : sensorType === 'humidity' ? '%' : sensorType === 'pressure' ? ' hPa' : '');
  const observedFormatted = `${inv.observed_value}${unit}`;

  let detectedTime = 'Live';
  if (inv.timestamp) {
    try {
      const parsed = new Date(inv.timestamp.includes('T') ? inv.timestamp : inv.timestamp.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) {
        detectedTime = parsed.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
      }
    } catch {
      detectedTime = 'Live';
    }
  }

  return {
    id: inv.id,
    stationId: inv.station_id,
    stationName: inv.station_name,
    location: inv.station_name,
    sensor: sensorType,
    title,
    description: inv.probable_cause,
    severity: inv.severity,
    observedValue: observedFormatted,
    expectedRange: inv.expected_range,
    deviationPercent: 0,
    detectedAt: detectedTime,
    status: 'Investigating',
    evidence: {
      historical: inv.historical_drift
        ? `30d Baseline: ${inv.historical_drift.baseline_mean.toFixed(1)}${unit} (Dev: ${inv.historical_drift.deviation_from_baseline > 0 ? '+' : ''}${inv.historical_drift.deviation_from_baseline.toFixed(1)}${unit}) | Trend: ${inv.historical_drift.classification} (${inv.historical_drift.rate_per_week > 0 ? '+' : ''}${inv.historical_drift.rate_per_week.toFixed(2)}${unit}/wk) | LSTM: ${inv.lstm_reconstruction_error !== null ? inv.lstm_reconstruction_error.toFixed(4) : 'N/A (3h)'}`
        : inv.lstm_reconstruction_error !== null
        ? `LSTM Autoencoder Error: ${inv.lstm_reconstruction_error.toFixed(4)} (Threshold: ${inv.lstm_threshold.toFixed(4)}, Ratio: ${(inv.lstm_error_ratio || 0).toFixed(2)}x, Dominant Driver: ${inv.dominant_feature || 'N/A'})`
        : `N/A — 3h cadence (excluded from LSTM; rule-based only)`,
      crossStation: inv.spatial_consensus.classification
        ? `${inv.spatial_consensus.classification} [${inv.spatial_consensus.confidence} CONFIDENCE] (${inv.spatial_consensus.peer_basis || `${inv.spatial_consensus.neighbor_count} peers`}): ${inv.spatial_consensus.explanation || ''}`
        : inv.spatial_consensus.status === 'MATCH'
        ? `Spatial Consensus: MATCH with ${inv.spatial_consensus.neighbor_count} peer stations within 150km.`
        : `Spatial Consensus: ${inv.spatial_consensus.status} (${inv.spatial_consensus.neighbor_count} peers; delta: ${inv.spatial_consensus.diff !== null ? `${inv.spatial_consensus.diff.toFixed(1)}°C` : 'N/A'})`,
      physicalConsistency: `Rate-of-Change: ${inv.rate_of_change_check.status} (${inv.rate_of_change_check.value} ${inv.rate_of_change_check.unit}) | Range: ${inv.physical_range_check.status} | Zero-Variance: ${inv.zero_variance_check.status} (${inv.zero_variance_check.consecutive_constant_readings} cycles)`,
      recommendedAction: inv.recommended_action,
    },
    investigation: inv,
  };
};

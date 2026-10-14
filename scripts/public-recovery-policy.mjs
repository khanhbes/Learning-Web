/** Recovery never changes application data or treats a network outage as a failed submission. */
export function decidePublicRecovery({enabled,failures,localHealthy,tunnelHealthy,publicHealthy,internetReachable,gradingActive,now=Date.now(),nextRecoveryAt=0}) {
  if(!enabled||(localHealthy&&tunnelHealthy&&publicHealthy)||failures<3)return 'idle';
  if(!internetReachable)return 'wait-network';
  if(now<nextRecoveryAt)return 'cooldown';
  if(localHealthy&&tunnelHealthy&&!publicHealthy)return 'sync-alias';
  // An unhealthy local endpoint may belong to a crashed server with orphaned
  // job rows. Restart is only a proposal: PowerShell must verify the process
  // and listener, then protect live jobs before stopping anything.
  if(gradingActive&&localHealthy)return 'defer-grading';
  return 'restart';
}
export function recoveryRetryDelay(failedAttempts){
  return [2,5,10,30][Math.max(0,Math.min(3,Math.trunc(failedAttempts)-1))]*60000;
}

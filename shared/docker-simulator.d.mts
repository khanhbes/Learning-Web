export const DOCKER_SIM_NOTICE:string;
export function createDockerState(options?:any):any;
export function parseDockerCommand(line:string):string[];
export function dockerFrame(state:any,label?:string):any;
export function runDockerCommand(state:any,line:string):any;
export function runDockerScript(initial:any,script:string|string[]):any;

import Protocol from './Protocol';

interface IHilinkSmsConfig {
  login: string;
  sha256password: string;
  protocol?: Protocol;
  host?: string;
  silentLogs?: boolean;
  networkInterface?: string
  logger?: (info: string) => void;
  name?: string;
  parallelSmsCount?: number
}

export default IHilinkSmsConfig;

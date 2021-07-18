interface ISmsQueueItem {
  message: string;
  recipient: string | string[];
  callback: (error?: string) => void;
}

export default ISmsQueueItem;

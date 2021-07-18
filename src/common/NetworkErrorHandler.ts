const networkErrorHandler = (err: Error): void => {
  throw new Error(`[SMS] Network error: ${err.message}`);
}

export default networkErrorHandler;
interface IConnectorResponse {
  body: string;
  headers: {
    [name: string]: string;
  }
}

export default IConnectorResponse;

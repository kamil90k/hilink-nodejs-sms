interface IGetSessionResponse {
  response: {
    SesInfo: string[] | string;
    TokInfo: string[] | string;
  }
}

export default IGetSessionResponse;

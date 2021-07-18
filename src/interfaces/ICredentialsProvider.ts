import ISmsCredentials from './ISmsCredentials';

interface ICredentialsProvider {
  getCredentials(): Promise<ISmsCredentials>;

  destroy(): void;
}

export default ICredentialsProvider;

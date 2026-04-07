import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  type ICognitoStorage
} from "amazon-cognito-identity-js";

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

// Tokens live only in memory for the lifetime of the page.
// On reload or tab close, the user must sign in again.
class MemoryStorage implements ICognitoStorage {
  private store: Record<string, string> = {};

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const memoryStorage = new MemoryStorage();

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
  Storage: memoryStorage
});

export type SignInResult =
  | { kind: "success"; username: string; idToken: string }
  | { kind: "newPasswordRequired"; cognitoUser: CognitoUser };

export function signIn(username: string, password: string): Promise<SignInResult> {
  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool,
    Storage: memoryStorage
  });

  const authDetails = new AuthenticationDetails({
    Username: username,
    Password: password
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session: CognitoUserSession) => {
        resolve({
          kind: "success",
          username: cognitoUser.getUsername(),
          idToken: session.getIdToken().getJwtToken()
        });
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => {
        resolve({ kind: "newPasswordRequired", cognitoUser });
      }
    });
  });
}

export function completeNewPassword(
  cognitoUser: CognitoUser,
  newPassword: string
): Promise<{ username: string; idToken: string }> {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      {},
      {
        onSuccess: (session: CognitoUserSession) => {
          resolve({
            username: cognitoUser.getUsername(),
            idToken: session.getIdToken().getJwtToken()
          });
        },
        onFailure: (err) => reject(err)
      }
    );
  });
}

export function signOut(): void {
  const currentUser = userPool.getCurrentUser();
  currentUser?.signOut();
  memoryStorage.clear();
}

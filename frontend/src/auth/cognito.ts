import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from "amazon-cognito-identity-js";

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID
});

export interface StoredSession {
  username: string;
  idToken: string;
}

export function getStoredSession(forceRefresh = false): Promise<StoredSession | null> {
  const currentUser = userPool.getCurrentUser();

  if (!currentUser) return Promise.resolve(null);

  const toStoredSession = (session: CognitoUserSession) => ({
    username: currentUser.getUsername(),
    idToken: session.getIdToken().getJwtToken()
  });

  return new Promise((resolve) => {
    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        resolve(null);
        return;
      }

      if (!forceRefresh) {
        resolve(toStoredSession(session));
        return;
      }

      currentUser.refreshSession(session.getRefreshToken(), (refreshErr, refreshed: CognitoUserSession | null) => {
        resolve(refreshErr || !refreshed ? null : toStoredSession(refreshed));
      });
    });
  });
}

export type SignInResult =
  | { kind: "success"; username: string; idToken: string }
  | { kind: "newPasswordRequired"; cognitoUser: CognitoUser };

export function signIn(username: string, password: string): Promise<SignInResult> {
  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool
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
}

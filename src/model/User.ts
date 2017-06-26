/**
 * Created by Joshua on 28.05.2017.
 */
export interface User {
  readonly email: string;
  readonly userId: string;
  readonly displayName: string;
  readonly familyName: string;
  readonly givenName: string;
  readonly imageUrl: string;
  readonly idToken: string;
  readonly serverAuthCode: string;
  readonly accessToken: string;
  readonly expires: number;
  readonly expires_in: number;
}

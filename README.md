## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. In [Firebase Console](https://console.firebase.google.com/), open project `polycrow-32b7e`.
3. Open **Project settings**, select the Web app under **Your apps**, and copy its `apiKey`.
4. Create `.env.local` in the project root with the Web app values:

   ```env
   VITE_FIREBASE_API_KEY=paste_the_web_api_key_here
   VITE_FIREBASE_PROJECT_ID=polycrow-32b7e
   VITE_FIREBASE_AUTH_DOMAIN=polycrow-32b7e.firebaseapp.com
   VITE_FIREBASE_APP_ID=paste_the_web_app_id_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=paste_the_messaging_sender_id_here
   VITE_FIREBASE_STORAGE_BUCKET=polycrow-32b7e.firebasestorage.app
   VITE_FIREBASE_DATABASE_ID=(default)
   ```

5. In Firebase Console, enable **Authentication > Sign-in method > Google**.
6. Create or enable **Firestore Database** and publish the rules from `firestore.rules`.
7. Restart the dev server after changing `.env.local`:
   `npm run dev`

8. In **Google Cloud Console > APIs & Services > Credentials**, open the OAuth client used by Firebase and add this exact authorized redirect URI:
   `https://polycrow-32b7e.firebaseapp.com/__/auth/handler`
9. Add the same deployed hostname under **Firebase Authentication > Settings > Authorized domains**.
10. Do not commit `.env.local`; it is ignored by Git. Restart the dev server after changing it.

The Google sign-in error `redirect_uri_mismatch` means this redirect URI is missing or the app is using a different `authDomain`. The values above keep both sides on `polycrow-32b7e`.

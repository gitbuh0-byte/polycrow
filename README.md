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

   Configure the server email provider as well. Create a Resend API key and verify the sender domain, then add these server-side variables (for local development, put them in `.env` or `.env.local`):

   ```env
   RESEND_API_KEY=paste_the_resend_api_key_here
   RESEND_FROM_EMAIL=Poly-Crow <invites@your-verified-domain.example>
   ```

   The invitation is sent by the server through `POST /api/invitations` after an agreement is created. Never expose `RESEND_API_KEY` with a `VITE_` prefix.

5. In Firebase Console, enable **Authentication > Sign-in method > Google**.
6. Create or enable **Firestore Database** and publish the rules from `firestore.rules`.
7. Restart the dev server after changing `.env.local`:
   `npm run dev`

8. In **Google Cloud Console > APIs & Services > Credentials**, open the OAuth client used by Firebase and add this exact authorized redirect URI:
   `https://polycrow-32b7e.firebaseapp.com/__/auth/handler`
9. Add the same deployed hostname under **Firebase Authentication > Settings > Authorized domains**.
10. Do not commit `.env.local`; it is ignored by Git. Restart the dev server after changing it.

The Google sign-in error `redirect_uri_mismatch` means this redirect URI is missing or the app is using a different `authDomain`. The values above keep both sides on `polycrow-32b7e`.
